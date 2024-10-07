
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
        // Chọn tất cả các nút submit trong các biểu mẫu
        const buttons = document.querySelectorAll('form button[type="submit"]');

        buttons.forEach(button => {
            // Thay đổi loại nút thành 'button' để ngăn chặn gửi mặc định
            button.type = 'button';
            // Thêm sự kiện click
            button.addEventListener('click', async (event) => {
                event.preventDefault(); // Ngăn chặn gửi mặc định
                setLoadingState(event.target, true); // Hiển thị trạng thái đang tải

                // Tham chiếu đến biểu mẫu chứa nút được nhấn
                let form = event.target.closest('form');

                if (form) {
                    try {
                        // Kích hoạt captcha
                        const challengeObject = await window.sqrCaptchaTrigger();
                        const viechaptchaToken = await waitForCaptcha(challengeObject?.challenge_duration * 1000);

                        // Xác định URL hành động hiện tại của biểu mẫu
                        const action = form.action || window.location.href;
                        const url = new URL(action, window.location.origin);

                        // Thêm viechaptchaToken vào query parameters
                        url.searchParams.append('viechaptcha_token', viechaptchaToken);

                        // Cập nhật hành động của biểu mẫu với URL mới có chứa viechaptchaToken
                        form.action = url.toString();

                        // Gửi biểu mẫu theo phương thức ban đầu (POST hoặc GET)
                        form.submit();
                    } catch (error) {
                        console.error("captcha verification failed:", error);
                        // Hiển thị thôncg báo lỗi cho người dùng
                        alert("captcha verification failed. Please try again.");
                    } finally {
                        setLoadingState(event.target, false); // Ẩn trạng thái đang tải
                    }
                } else {
                    console.log("form not found");
                    setLoadingState(event.target, false); // Ẩn trạng thái đang tải
                }
            });
        });
    });
}(window, document));
