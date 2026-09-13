# 🥗 FITGORDO — Progressive Web App (PWA) de Dieta e Contagem de Macros

**FITGORDO** é uma aplicação web progressiva (PWA) de controlo nutricional pessoal, especialmente otimizada para iOS (iPhone Safari) e desktop. Permite registar refeições, ler códigos de barras via câmara com consulta inteligente ao Open Food Facts, gerir refeições habituais e acompanhar calorias e macronutrientes diariamente.

---

## 🛠️ Stack Tecnológica (Servidor Único no Render)

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + PWA (`vite-plugin-pwa`)
- **Backend**: Python 3.11 + FastAPI + SQLAlchemy 2.0 + PostgreSQL
- **Integração Externa**: Open Food Facts API + Cache em PostgreSQL
- **Segurança**: Hashing de Passwords com **Argon2id** e Tokens JWT

---

## 📱 Instalação da PWA no iPhone

1. Acede ao URL do teu serviço no Render através do Safari no iPhone (ex: `https://fitgordo.onrender.com`).
2. Toque no botão **Partilhar** (ícone do quadrado com a seta para cima no Safari).
3. Selecione **"Adicionar ao ecrã principal"** (Add to Home Screen).
4. Abra o **FITGORDO** a partir do ícone criado no ecrã principal. A aplicação funcionará em modo nativo/standalone.

---

## 🌍 Guia de Deploy 100% no Render (Servidor Único)

Todo o projeto (Frontend React + Backend FastAPI + Base de Dados PostgreSQL) pode ser alojado **exclusivamente no Render** num único serviço!

1. Cria um repositório no GitHub com os ficheiros do projeto.
2. No dashboard do [Render.com](https://render.com):
   - **PostgreSQL Database**: Cria uma base de dados PostgreSQL gratuita. Copia a `Internal Database URL`.
   - **Web Service**: Cria um novo Web Service ligado ao repositório GitHub.
     - **Environment**: `Docker`
     - **Dockerfile Path**: `./Dockerfile`
3. Adiciona as seguintes variáveis de ambiente no Web Service do Render:
   - `DATABASE_URL`: URL da base de dados PostgreSQL do Render.
   - `SECRET_KEY`: Uma frase/chave longa aleatória.
4. Faz o Deploy. O Render vai compilar o frontend React e servir a aplicação PWA e a API no mesmo endereço (ex: `https://fitgordo.onrender.com`).

---

## 🧪 Testes Automatizados (Pytest)

```bash
cd backend
PYTHONPATH=backend pytest backend/tests
```
