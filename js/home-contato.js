/**
 * home-contato.js
 * Formulário de contato da home — Formspree.
 * Extraído no R3 sem alteração de comportamento.
 */
(function () {
    const FORMSPREE_ID = 'xpqykpqd'; // Formspree ID configurado

    const contactForm = document.getElementById('contactForm');
    const formMessage = document.getElementById('formStatus');

    if (!contactForm) return;

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('.form-submit');
        submitBtn.classList.add('loading');
        if (formMessage) { formMessage.style.display = 'none'; }

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
                method: 'POST',
                headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            submitBtn.classList.remove('loading');

            if (res.ok) {
                if (formMessage) {
                    formMessage.className = 'form-status success';
                    formMessage.textContent = '✅ Mensagem enviada com sucesso! Responderemos em breve.';
                    formMessage.style.display = 'block';
                }
                contactForm.reset();
                setTimeout(() => { if (formMessage) formMessage.style.display = 'none'; }, 6000);
            } else {
                throw new Error('Erro no envio');
            }
        } catch (err) {
            submitBtn.classList.remove('loading');
            if (formMessage) {
                formMessage.className = 'form-status error';
                formMessage.textContent = '❌ Não foi possível enviar. Tente ligar: (42) 3532-4163';
                formMessage.style.display = 'block';
            }
            console.error('Formspree erro:', err);
        }
    });
})();
