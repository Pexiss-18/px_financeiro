// Configuração do projeto Firebase usado para login e sincronização.
//
// Estes valores NÃO são segredos: identificam publicamente o projeto (todo
// site com Firebase os expõe no bundle). A proteção dos dados vem das regras
// do Firestore (cada usuário só lê/escreve o próprio documento) e da
// criptografia ponta a ponta feita no aparelho antes do upload.
//
// Como preencher: siga o passo a passo em CONFIGURAR-NUVEM.md e cole aqui o
// objeto exibido pelo console do Firebase.
export const firebaseConfig = {
  apiKey: 'AIzaSyCIFo_-cGKtgk3mRQsjvmAOVGwU5gU9eqw',
  authDomain: 'px-financeiro.firebaseapp.com',
  projectId: 'px-financeiro',
  storageBucket: 'px-financeiro.firebasestorage.app',
  messagingSenderId: '2547362049',
  appId: '1:2547362049:web:578df48a8e755e4b47d300',
}

// Enquanto a configuração não for preenchida, o app funciona normalmente
// (dados locais) e o menu Conta explica como ativar a sincronização.
export const isFirebaseConfigured = !Object.values(firebaseConfig).some((value) =>
  String(value).includes('COLE_AQUI')
)
