<?php
/**
 * Plugin Name: BKW Pre-Application Form
 * Plugin URI: https://bkwservicing.com
 * Description: Multi-step pre-application form for BKW Servicing
 * Version: 1.0.0
 * Author: BKW Servicing
 * Author URI: https://bkwservicing.com
 * Text Domain: bkw-preapp-form
 */

if (!defined('ABSPATH')) {
    exit;
}

class BKW_PreApp_Form {
    public function __construct() {
        add_action('init', array($this, 'init'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        add_shortcode('bkw_preapp_form', array($this, 'render_form'));
        add_action('wp_ajax_submit_preapp_form', array($this, 'handle_form_submission'));
        add_action('wp_ajax_nopriv_submit_preapp_form', array($this, 'handle_form_submission'));
    }

    public function init() {
        $this->create_tables();
    }

    public function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}bkw_preapp_submissions (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            submission_date datetime DEFAULT CURRENT_TIMESTAMP,
            legal_business_name varchar(255),
            contact_name varchar(255),
            contact_email varchar(255),
            dba_name varchar(255),
            legal_address text,
            legal_city varchar(255),
            legal_state varchar(50),
            legal_zip varchar(20),
            dba_address text,
            dba_city varchar(255),
            dba_state varchar(50),
            dba_zip varchar(20),
            business_phone varchar(50),
            customer_service_phone varchar(50),
            fax_number varchar(50),
            website_url varchar(255),
            locations int,
            average_ticket decimal(10,2),
            monthly_volume decimal(10,2),
            store_front boolean,
            moto boolean,
            ecommerce boolean,
            keyed_percent int,
            swiped_percent int,
            principal_first_name varchar(255),
            principal_last_name varchar(255),
            principal_middle_initial varchar(10),
            principal_address text,
            principal_city varchar(255),
            principal_state varchar(50),
            principal_zip varchar(20),
            principal_phone varchar(50),
            principal_email varchar(255),
            principal_dob date,
            principal_id_number varchar(255),
            ownership_percent int,
            controlling_individual boolean,
            us_citizen boolean,
            country_of_origin varchar(255),
            products_services text,
            equipment_software text,
            business_type varchar(255),
            business_start_date date,
            bank_account_name varchar(255),
            bank_name varchar(255),
            bank_phone varchar(50),
            routing_number varchar(255),
            account_number varchar(255),
            federal_tax_id varchar(255),
            social_security varchar(255),
            PRIMARY KEY (id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }

    public function enqueue_scripts() {
        wp_enqueue_style('bkw-preapp-form-style', plugins_url('css/style.css', __FILE__));
        wp_enqueue_script('bkw-preapp-form-script', plugins_url('js/script.js', __FILE__), array('jquery'), '1.0.0', true);
        wp_localize_script('bkw-preapp-form-script', 'bkw_ajax', array(
            'ajax_url' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('bkw_preapp_nonce')
        ));
    }

    public function render_form() {
        ob_start();
        include(plugin_dir_path(__FILE__) . 'templates/form.php');
        return ob_get_clean();
    }

    public function handle_form_submission() {
        check_ajax_referer('bkw_preapp_nonce', 'nonce');
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'bkw_preapp_submissions';
        
        $data = $this->sanitize_form_data($_POST);
        
        $wpdb->insert($table_name, $data);
        
        if ($wpdb->insert_id) {
            $this->send_notification_email($data);
            wp_send_json_success('Form submitted successfully');
        } else {
            wp_send_json_error('Error saving form data');
        }
        
        wp_die();
    }

    private function sanitize_form_data($post_data) {
        $sanitized = array();
        foreach ($post_data as $key => $value) {
            if (in_array($key, array('store_front', 'moto', 'ecommerce', 'controlling_individual', 'us_citizen'))) {
                $sanitized[$key] = isset($value) && $value === 'true';
            } elseif (in_array($key, array('keyed_percent', 'swiped_percent', 'ownership_percent', 'locations'))) {
                $sanitized[$key] = intval($value);
            } elseif (in_array($key, array('average_ticket', 'monthly_volume'))) {
                $sanitized[$key] = floatval($value);
            } else {
                $sanitized[$key] = sanitize_text_field($value);
            }
        }
        return $sanitized;
    }

    private function send_notification_email($data) {
        $to = get_option('admin_email');
        $subject = 'New Pre-Application Submission';
        $message = $this->generate_email_content($data);
        $headers = array('Content-Type: text/html; charset=UTF-8');
        
        wp_mail($to, $subject, $message, $headers);
    }

    private function generate_email_content($data) {
        ob_start();
        include(plugin_dir_path(__FILE__) . 'templates/email-template.php');
        return ob_get_clean();
    }
}

new BKW_PreApp_Form();