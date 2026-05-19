from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# URL do seu Webhook
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1506333881802952734/0jTVn9XUhV4EgJSQHmD_I_HxtqTXZctEUdDu1LvZExDweNu6dVLWIniUeHaNsvF1de5K"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/send_webhook', methods=['POST'])
def send_webhook():
    data = request.json
    
    # Formatação da mensagem para o Discord
    multa_value = data['multa']
    fianca_value = data['fianca']
    if not str(multa_value).startswith('R$'):
        multa_value = f"R$ {multa_value}"
    if fianca_value != 'INAFIANÇÁVEL' and not str(fianca_value).startswith('R$'):
        fianca_value = f"R$ {fianca_value}"

    payload = {
        "embeds": [{
            "title": "📑 Novo Registro Penal - Capital City",
            "color": 15158332, # Cor Vermelha
            "fields": [
                {"name": "👤 Preso", "value": f"{data['nome_preso']} (RG: {data['rg_preso']})", "inline": True},
                {"name": "⚖️ Advogado", "value": f"RG: {data['rg_advogado']}", "inline": True},
                {"name": "📜 Crimes", "value": data['crimes_list']},
                {"name": "⏳ Pena Total", "value": f"{data['pena']} meses", "inline": True},
                {"name": "💰 Multa Total", "value": multa_value, "inline": True},
                {"name": "🔓 Fiança", "value": fianca_value, "inline": True},
            ],
            "footer": {"text": "Sistema OAD - Ordem dos Advogados de Dinastia"}
        }]
    }
    
    response = requests.post(DISCORD_WEBHOOK_URL, json=payload)
    if response.status_code == 204:
        return jsonify({"status": "success"})
    return jsonify({"status": "error", "detail": response.text}), response.status_code

if __name__ == '__main__':
    app.run(debug=True)