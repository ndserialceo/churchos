/**
 * ChurchOS - App JavaScript
 */

document.addEventListener('DOMContentLoaded', function () {

    // ===== Auto-hide alerts after 5 seconds =====
    const alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function (alert) {
        setTimeout(function () {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            bsAlert.close();
        }, 5000);
    });

    // ===== Confirm dialogs for delete actions =====
    document.addEventListener('click', function (e) {
        const trigger = e.target.closest('[data-confirm]');
        if (!trigger) return;

        const message = trigger.getAttribute('data-confirm') || 'Are you sure you want to delete this item?';
        if (!confirm(message)) {
            e.preventDefault();
            e.stopPropagation();
        }
    });

    // ===== Page loader fade-out =====
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.style.transition = 'opacity 0.3s ease';
        loader.style.opacity = '0';
        setTimeout(function () {
            loader.style.display = 'none';
        }, 300);
    }

});

// ===== Form validation helpers =====
function validateRequired(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;

    let valid = true;
    const inputs = form.querySelectorAll('[required]');

    inputs.forEach(function (input) {
        const value = input.value.trim();
        const feedback = input.closest('.mb-3')?.querySelector('.invalid-feedback');

        if (!value) {
            input.classList.add('is-invalid');
            if (feedback) feedback.style.display = 'block';
            valid = false;
        } else {
            input.classList.remove('is-invalid');
            if (feedback) feedback.style.display = 'none';
        }
    });

    return valid;
}

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^[\d\s\+\-\(\)]{7,20}$/;
    return re.test(phone);
}

function showToast(message, type) {
    type = type || 'success';

    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(div);
    }

    const toastEl = document.createElement('div');
    toastEl.className = 'toast align-items-center text-bg-' + type + ' border-0';
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');

    toastEl.innerHTML =
        '<div class="d-flex">' +
            '<div class="toast-body">' + message + '</div>' +
            '<button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>' +
        '</div>';

    document.getElementById('toast-container').appendChild(toastEl);

    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();

    toastEl.addEventListener('hidden.bs.toast', function () {
        toastEl.remove();
    });
}