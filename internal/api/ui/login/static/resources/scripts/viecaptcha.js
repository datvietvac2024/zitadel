
function waitForCaptcha(timeout) {
    return new Promise((resolve, reject) => {
        const originalCallback = window.captchaCallback;

        window.captchaCallback = (challenge_solution) => {
            window.sqrCaptchaReset();

            resolve(challenge_solution);

            if (typeof originalCallback === 'function') {
                originalCallback(challenge_solution);
            }
        };

        setTimeout(() => {
            reject(new Error('Timeout waiting for captcha callback'));
        }, timeout);
    });
}

/**
 * Function to change the loading state of the button
 * @param {HTMLElement} button
 * @param {boolean} isLoading
 */
function setLoadingState(button, isLoading) {
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}
(function(window, document, undefined){
    document.addEventListener('DOMContentLoaded', () => {
        // Lấy tất cả các button trong form có type là submit
        const buttons = document.querySelectorAll('form button[type="submit"]');

        buttons.forEach(button => {
            // Đổi type của button thành button
            button.type = 'button';
            // Thêm sự kiện onClick
            button.addEventListener('click', async (event) => {
                event.preventDefault();
                setLoadingState(event.target, true);
                let form = document.forms[0];

                if (form) {
                    const challengeObject = await window.sqrCaptchaTrigger();
                    const viechaptchaToken = await waitForCaptcha(challengeObject?.challenge_duration * 1000);

                    // Loop through each element in the form và gửi request
                    let xhr = new XMLHttpRequest();
                    xhr.open(form.method, form.action, true);

                    // Thêm challenge key vào header trực tiếp
                    xhr.setRequestHeader('X-Viecaptcha-Token', viechaptchaToken);

                    // Gửi dữ liệu form
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.onload = function() {
                        if (xhr.status >= 200 && xhr.status < 400) {
                            // Sau khi xử lý xong, submit form thật
                            document.open();
                            document.write(xhr.responseText);
                            document.close();
                        } else {
                            // Xử lý lỗi (nếu có)
                            console.error("Error processing the request.");
                        }
                    };

                    // Gửi dữ liệu form
                    xhr.send(new URLSearchParams(new FormData(form)).toString());
                } else {
                    console.log("Form not found");
                }
            });
        });
    });
}(window, document));