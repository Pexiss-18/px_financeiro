# Configurar a sincronização na nuvem (Firebase)

O app funciona 100% sem isso — os dados ficam no aparelho. Este passo a passo
ativa o **login com sincronização entre aparelhos**. Leva uns 10 minutos e é
gratuito (plano Spark do Firebase, sem cartão de crédito).

## Como a privacidade é mantida

- Antes de subir, os dados são **criptografados no seu aparelho** com uma chave
  derivada da sua frase-secreta (AES-256). Na nuvem só existe um bloco cifrado —
  nem o Google consegue ler.
- As regras do Firestore garantem que cada usuário só acessa o próprio documento.
- A frase-secreta **não tem recuperação**: se for esquecida, só dá para
  recomeçar a nuvem a partir de um aparelho que ainda tenha os dados.

## Passo a passo

### 1. Criar o projeto

1. Acesse https://console.firebase.google.com e entre com sua conta Google.
2. **Criar um projeto** → nome: `px-financeiro` (ou outro) → pode **desativar
   o Google Analytics** → criar.

### 2. Ativar o login por e-mail e senha

1. No menu lateral: **Criação (Build) → Authentication → Vamos começar**.
2. Aba **Sign-in method** → **E-mail/senha** → ative a primeira chave
   (não precisa do "link por e-mail") → salvar.

### 3. Criar o banco de dados

1. Menu lateral: **Criação (Build) → Firestore Database → Criar banco de dados**.
2. Local: `southamerica-east1 (São Paulo)` → **modo de produção** → criar.

### 4. Aplicar as regras de segurança

1. Ainda no Firestore, abra a aba **Regras**.
2. Apague o conteúdo e cole o arquivo [`firestore.rules`](firestore.rules)
   deste projeto → **Publicar**.

### 5. Registrar o app da web e copiar a configuração

1. Engrenagem (canto superior esquerdo) → **Configurações do projeto**.
2. Em "Seus apps", clique no ícone **`</>`** (Web) → apelido: `px-financeiro`
   → **não** marque Firebase Hosting → registrar.
3. Vai aparecer um bloco `const firebaseConfig = { ... }`. Copie os valores
   para o arquivo [`src/lib/firebaseConfig.js`](src/lib/firebaseConfig.js),
   substituindo os `COLE_AQUI`.

> Esses valores **não são segredos** (todo site com Firebase os expõe no
> código). Pode fazer commit normalmente — a proteção vem das regras do
> passo 4 e da criptografia ponta a ponta.

### 6. Autorizar o site publicado

1. Em **Authentication → Settings → Domínios autorizados**, confirme que
   `localhost` já está na lista e **adicione**: `pexiss-18.github.io`.

### 7. Publicar

```
git add -A
git commit -m "Ativa sincronização na nuvem"
git push
```

O GitHub Actions publica o site atualizado em ~2 minutos.

## Como usar no dia a dia

1. No app, toque no ícone de **pessoa** (barra superior) → **criar conta**
   (e-mail e senha).
2. Crie a **frase-secreta** (mínimo 8 caracteres) — anote em local seguro;
   ela é a chave dos seus dados e não tem recuperação.
3. Em outro aparelho: entre com o mesmo e-mail/senha e digite a **mesma
   frase-secreta**. Tudo aparece sincronizado.
4. Dali em diante a sincronização é automática (ícone de nuvem com ponto
   verde = sincronizado).

## Limites do plano gratuito

Para uso pessoal, folgadíssimo: 50 mil leituras e 20 mil escritas por dia no
Firestore — o app faz uma escrita por "rajada" de edições e uma leitura por
abertura. O documento criptografado pode ter até ~900 KB (muitos anos de
lançamentos).
