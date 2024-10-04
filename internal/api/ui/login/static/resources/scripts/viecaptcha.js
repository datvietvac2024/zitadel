document.addEventListener('DOMContentLoaded', () => {
    // Lấy tất cả các button trong form có type là submit
    const buttons = document.querySelectorAll('form button[type="submit"]');

    buttons.forEach(button => {
        // Đổi type của button thành button
        button.type = 'button';

        // Thêm sự kiện onClick
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            let form = document.forms[0];

            if (form) {
                // Gọi hàm fetchChallengeData và lấy challenge payload
                const challengePayload = await fetchChallengeData();

                // Loop through each element in the form và gửi request
                let xhr = new XMLHttpRequest();
                xhr.open(form.method, form.action, true);

                // Thêm challenge key vào header trực tiếp
                xhr.setRequestHeader('X-Viecaptcha-Token', challengePayload);

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

async function fetchChallengeData() {
    try {
        // Gọi API và chờ phản hồi
        const response = await fetch('https://dev-api.vieon.vn/viecaptcha/api/v1/pow/challenge', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }

        // Chuyển đổi phản hồi thành JSON
        const challengeData = await response.json();

        if (challengeData.code !== 0) {
            console.log('Error fetching challenge data: ', challengeData);
            throw new Error('Error fetching challenge data: ' + challengeData.message);
        }

        // Tạo Web Worker
        return new Promise((resolve, reject) => {
            const worker = new Worker("./resources/scripts/worker.js");

            worker.postMessage({
                salt: challengeData.data?.salt,
                timestamp: challengeData.data?.timestamp,
                difficulty: challengeData.data?.difficulty
            });

            worker.onmessage = function(e) {
                const result = e.data;

                // Tạo payload gửi lại server với đầy đủ thông tin
                const payload = {
                    nonce: result.nonce,
                    hash: result.hash,
                    mouse_moves: 100,
                    key_strokes: 10,
                    challenge: challengeData.data
                };

                // Trả về payload string (không cần lưu vào form)
                resolve(btoa(JSON.stringify(payload)));
            };

            worker.onerror = function(err) {
                reject(err);
            };
        });
    } catch (error) {
        console.error('Error:', error);
    }
}
