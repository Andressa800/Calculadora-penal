function formatMoney(value) {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
}

function updateTotals() {
    const crimeInputs = Array.from(document.querySelectorAll('.crime-check'));
    let totalPena = 0;
    let totalMulta = 0;
    let totalFianca = 0;
    let hasInafiançavel = false;
    const selected = [];

    crimeInputs.forEach((input) => {
        if (!input.checked) {
            return;
        }

        const [pena, multa, fianca] = input.value.split('|');
        totalPena += Number(pena) || 0;
        totalMulta += Number(multa) || 0;
        if (fianca === 'NA') {
            hasInafiançavel = true;
        } else {
            totalFianca += Number(fianca) || 0;
        }

        selected.push(input.dataset.nome);
    });

    if (totalPena > 100) {
        totalPena = 100;
    }

    const advogadoConstituido = document.getElementById('adv-constituido').checked;
    if (advogadoConstituido && !hasInafiançavel) {
        totalFianca = Math.round(totalFianca * 0.7);
    }

    document.getElementById('display-pena').textContent = totalPena;
    document.getElementById('display-multa').textContent = `R$ ${formatMoney(totalMulta)}`;
    document.getElementById('display-fianca').textContent = hasInafiançavel ? 'INAFIANÇÁVEL' : `R$ ${formatMoney(totalFianca)}`;

    const crimesArea = document.getElementById('selected-crimes');
    crimesArea.value = selected.length ? selected.join('\n') : 'Nenhum crime selecionado';
}

function showHelp(button) {
    const input = button.closest('.crime-item').querySelector('.crime-check');
    const title = input.dataset.nome;
    const description = input.dataset.description;
    openModal(title, description);
}

function openModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = `<p>${content}</p>`;
    document.getElementById('helpModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('helpModal').style.display = 'none';
}

function openFullLaw() {
    const crimeInputs = Array.from(document.querySelectorAll('.crime-check'));
    const groups = {};

    crimeInputs.forEach((input) => {
        const group = input.dataset.group || 'Artigos';
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push({
            title: input.dataset.nome,
            description: input.dataset.description,
        });
    });

    let html = '';
    Object.keys(groups).forEach((group) => {
        html += `<h4>${group}</h4>`;
        groups[group].forEach((item) => {
            html += `<p><strong>${item.title}</strong> - ${item.description}</p>`;
        });
    });

    document.getElementById('modalTitle').textContent = 'Código Penal Completo';
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('helpModal').style.display = 'flex';
}

function clearAll() {
    document.querySelectorAll('.crime-check').forEach((input) => {
        input.checked = false;
    });
    document.getElementById('adv-constituido').checked = false;
    document.getElementById('nome_preso').value = '';
    document.getElementById('rg_preso').value = '';
    document.getElementById('rg_advogado').value = '';
    updateTotals();
}

async function enviarDados() {
    const nomePreso = document.getElementById('nome_preso').value.trim();
    const rgPreso = document.getElementById('rg_preso').value.trim();
    const rgAdvogado = document.getElementById('rg_advogado').value.trim();
    const crimes = Array.from(document.querySelectorAll('.crime-check'))
        .filter((input) => input.checked)
        .map((input) => input.dataset.nome);

    if (!nomePreso || !rgPreso || !rgAdvogado || crimes.length === 0) {
        alert('Preencha nome, RG do preso, RG do advogado e selecione pelo menos um crime.');
        return;
    }

    updateTotals();

    const payload = {
        nome_preso: nomePreso,
        rg_preso: rgPreso,
        rg_advogado: rgAdvogado,
        crimes_list: crimes.join('\n'),
        pena: document.getElementById('display-pena').textContent,
        multa: document.getElementById('display-multa').textContent.replace('R$ ', ''),
        fianca: document.getElementById('display-fianca').textContent,
    };

    try {
        const response = await fetch('/send_webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.status === 'success') {
            alert('Registro enviado para o Discord com sucesso.');
        } else {
            alert('Falha ao enviar o registro.');
        }
    } catch (error) {
        console.error(error);
        alert('Erro ao enviar os dados. Verifique a conexão e tente novamente.');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    updateTotals();
    document.querySelectorAll('.crime-check').forEach((input) => {
        input.addEventListener('change', updateTotals);
    });

    document.getElementById('adv-constituido').addEventListener('change', updateTotals);
    document.getElementById('clear-btn').addEventListener('click', clearAll);

    window.addEventListener('click', (event) => {
        const modal = document.getElementById('helpModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});
