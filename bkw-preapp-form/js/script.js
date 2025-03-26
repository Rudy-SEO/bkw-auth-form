jQuery(document).ready(function($) {
    let currentStep = 1;
    const totalSteps = 5;

    function updateProgress() {
        const progress = (currentStep - 1) / (totalSteps - 1) * 100;
        $('.bkw-progress-fill').css('width', progress + '%');
    }

    function showStep(step) {
        $('.bkw-form-step').removeClass('active');
        $('#bkw-step-' + step).addClass('active');
        updateProgress();

        // Update buttons
        if (step === 1) {
            $('.bkw-btn-prev').hide();
        } else {
            $('.bkw-btn-prev').show();
        }

        if (step === totalSteps) {
            $('.bkw-btn-next').text('Submit');
        } else {
            $('.bkw-btn-next').text('Continue');
        }

        // Scroll to top of form
        $('html, body').animate({
            scrollTop: $('.bkw-form-container').offset().top - 50
        }, 500);
    }

    function validateStep(step) {
        let isValid = true;
        const currentStepElement = $('#bkw-step-' + step);
        
        // Clear previous errors
        currentStepElement.find('.bkw-error-message').remove();
        currentStepElement.find('.error').removeClass('error');

        // Validate required fields
        currentStepElement.find('[required]').each(function() {
            const field = $(this);
            const value = field.val().trim();

            if (!value) {
                isValid = false;
                markFieldAsError(field, 'This field is required');
            } else {
                // Additional validation based on field type
                switch(field.attr('type')) {
                    case 'email':
                        if (!isValidEmail(value)) {
                            isValid = false;
                            markFieldAsError(field, 'Please enter a valid email address');
                        }
                        break;
                    case 'tel':
                        if (!isValidPhone(value)) {
                            isValid = false;
                            markFieldAsError(field, 'Please enter a valid phone number');
                        }
                        break;
                    case 'url':
                        if (!isValidURL(value)) {
                            isValid = false;
                            markFieldAsError(field, 'Please enter a valid URL');
                        }
                        break;
                }
            }
        });

        // Validate percentage fields
        const keyedPercent = parseInt($('#keyed_percent').val()) || 0;
        const swipedPercent = parseInt($('#swiped_percent').val()) || 0;
        if (keyedPercent + swipedPercent !== 100) {
            isValid = false;
            markFieldAsError($('#keyed_percent'), 'Keyed and swiped percentages must sum to 100%');
            markFieldAsError($('#swiped_percent'), 'Keyed and swiped percentages must sum to 100%');
        }

        return isValid;
    }

    function markFieldAsError(field, message) {
        field.addClass('error');
        field.after('<div class="bkw-error-message">' + message + '</div>');
    }

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isValidPhone(phone) {
        return /^\(\d{3}\) \d{3}-\d{4}$/.test(phone);
    }

    function isValidURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    $('.bkw-btn-next').click(function(e) {
        e.preventDefault();

        if (validateStep(currentStep)) {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            } else {
                submitForm();
            }
        }
    });

    $('.bkw-btn-prev').click(function(e) {
        e.preventDefault();
        if (currentStep > 1) {
            currentStep--;
            showStep(currentStep);
        }
    });

    function submitForm() {
        const formData = new FormData($('#bkw-preapp-form')[0]);
        formData.append('action', 'submit_preapp_form');
        formData.append('nonce', bkw_ajax.nonce);

        // Disable submit button and show loading state
        $('.bkw-btn-next').prop('disabled', true).text('Submitting...');

        $.ajax({
            url: bkw_ajax.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    $('#bkw-preapp-form').html(
                        '<div class="bkw-success-message">' +
                        '<h3>Thank You!</h3>' +
                        '<p>Your pre-application has been submitted successfully. ' +
                        'Our team will review your information and contact you shortly.</p>' +
                        '</div>'
                    );
                } else {
                    alert('There was an error submitting the form. Please try again.');
                    $('.bkw-btn-next').prop('disabled', false).text('Submit');
                }
            },
            error: function() {
                alert('There was an error submitting the form. Please try again.');
                $('.bkw-btn-next').prop('disabled', false).text('Submit');
            }
        });
    }

    // Format phone numbers
    $('.phone-input').on('input', function() {
        let number = $(this).val().replace(/[^0-9]/g, '');
        if (number.length > 10) {
            number = number.substr(0, 10);
        }
        if (number.length >= 6) {
            number = number.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
        } else if (number.length >= 3) {
            number = number.replace(/(\d{3})(\d{0,3})/, '($1) $2');
        }
        $(this).val(number);
    });

    // Format percentages
    $('.percentage-input').on('input', function() {
        let value = parseInt($(this).val()) || 0;
        if (value > 100) {
            $(this).val(100);
        } else if (value < 0) {
            $(this).val(0);
        }
    });

    // Format currency inputs
    $('.currency-input').on('input', function() {
        let value = $(this).val().replace(/[^0-9.]/g, '');
        if (value) {
            value = parseFloat(value).toFixed(2);
            $(this).val(value);
        }
    });

    // Initialize form
    showStep(1);
});