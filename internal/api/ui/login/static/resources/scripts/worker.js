self.onmessage = function(e) {
    const { salt, timestamp, difficulty } = e.data;

    let nonce = 0;

    function arrayBufferToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => ('00' + b.toString(16)).slice(-2))
            .join('');
    }

    function hexToBinary(hex) {
        return hex.split('').map(h => {
            return parseInt(h, 16).toString(2).padStart(4, '0');
        }).join('');
    }

    function solvePoW() {
        let text = salt + timestamp + nonce;
        let encoder = new TextEncoder();
        let data = encoder.encode(text);

        crypto.subtle.digest('SHA-256', data).then((hashBuffer) => {
            let hashHex = arrayBufferToHex(hashBuffer);
            let binaryHash = hexToBinary(hashHex);
            let prefix = '0'.repeat(difficulty);

            if (binaryHash.startsWith(prefix)) {
                self.postMessage({ nonce: nonce.toString(), hash: hashHex });
            } else {
                nonce++;
                solvePoW();
            }
        });
    }

    solvePoW();
};
