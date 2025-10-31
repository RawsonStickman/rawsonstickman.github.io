/*!
 * script.js
 * Versão: 2.0.0
 * Última atualização: 31/10/2025
 * TIFF convertido usando createImageBitmap nativo do navegador
 */

const SCRIPT_VERSION = "2.0.0";
const MAX_IMAGENS = 10;
const QUALIDADE_JPG = 0.8;

// Elementos DOM
const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");
const btnUploadTudo = document.getElementById("uploadTudo");
const dropzone = document.getElementById("dropzone");
const instrucoes = document.getElementById("instrucoes");
const loading = document.getElementById("loading");
const linksPublicos = document.getElementById("linksPublicos");
const listaLinks = document.getElementById("listaLinks");
const progressoUpload = document.getElementById("progressoUpload");

let linksParaDownload = [];
let blobsParaUpload = [];

console.log(`✅ Script carregado - Versão ${SCRIPT_VERSION}`);

// Processar arquivos
function processarArquivos(files) {
  const imagens = Array.from(files)
    .filter(file => {
      const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");
      const isImage = file.type.startsWith("image/");
      return isImage || isTiff;
    })
    .slice(0, MAX_IMAGENS);

  if (!imagens.length) {
    mostrarErro("Nenhuma imagem válida foi selecionada.");
    return;
  }

  limparInterface();
  
  let processadas = 0;
  const total = imagens.length;

  imagens.forEach(async file => {
    try {
      const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");
      
      if (isTiff) {
        await processarTiffNativo(file);
      } else {
        await processarImagemNormal(file);
      }
      
      processadas++;
      if (processadas === total) finalizarProcessamento();
      
    } catch (err) {
      console.error(`Erro ao processar ${file.name}:`, err);
      mostrarErro(`Erro ao processar ${file.name}: ${err.message}`);
      processadas++;
      if (processadas === total) finalizarProcessamento();
    }
  });
}

// Processar TIFF usando API nativa do navegador
async function processarTiffNativo(file) {
  try {
    // Tentar usar createImageBitmap (suportado em navegadores modernos)
    const imageBitmap = await createImageBitmap(file);
    
    const canvas = document.createElement("canvas");
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    const ctx = canvas.getContext("2d");
    
    // Fundo branco
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageBitmap, 0, 0);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Erro ao converter TIFF"));
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
        blobsParaUpload.push({ blob, nome: nomeArquivo });
        
        const card = criarCardImagem(url, nomeArquivo, blob, canvas.width, canvas.height);
        downloads.appendChild(card);
        linksParaDownload.push(card.querySelector(".image-link"));
        
        resolve();
      }, "image/jpeg", QUALIDADE_JPG);
    });
    
  } catch (err) {
    // Se createImageBitmap falhar, tentar como imagem normal
    console.warn("createImageBitmap falhou, tentando método alternativo...");
    return processarImagemNormal(file);
  }
}

// Processar imagem normal
async function processarImagemNormal(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = e => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        // Fundo branco para transparência
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error("Erro ao converter imagem"));
            return;
          }
          
          const url = URL.createObjectURL(blob);
          const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          blobsParaUpload.push({ blob, nome: nomeArquivo });
          
          const card = criarCardImagem(url, nomeArquivo, blob, img.width, img.height);
          downloads.appendChild(card);
          linksParaDownload.push(card.querySelector(".image-link"));
          
          resolve();
        }, "image/jpeg", QUALIDADE_JPG);
      };
      
      img.onerror = () => reject(new Error("Erro ao carregar imagem"));
      img.src = e.target.result;
    };
    
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsDataURL(file);
  });
}

// Criar card de imagem
function criarCardImagem(url, nomeArquivo, blob, largura, altura) {
  const card = document.createElement("div");
  card.className = "image-card";

  const linkImagem = document.createElement("a");
  linkImagem.href = url;
  linkImagem.download = nomeArquivo;

  const imgPreview = document.createElement("img");
  imgPreview.src = url;
  imgPreview.className = "image-preview";
  imgPreview.alt = nomeArquivo;

  linkImagem.appendChild(imgPreview);

  const linkDownload = document.createElement("a");
  linkDownload.href = url;
  linkDownload.download = nomeArquivo;
  linkDownload.className = "image-link";
  linkDownload.textContent = `⬇️ ${nomeArquivo}`;

  const info = document.createElement("div");
  info.className = "image-info";
  const tamanhoKB = (blob.size / 1024).toFixed(2);
  info.textContent = `${largura}x${altura} • ${tamanhoKB} KB`;

  card.appendChild(linkImagem);
  card.appendChild(linkDownload);
  card.appendChild(info);
  
  return card;
}

// Finalizar processamento
function finalizarProcessamento() {
  if (linksParaDownload.length > 0) {
    btnBaixarTudo.style.display = "inline-block";
    btnUploadTudo.style.display = "inline-block";
    instrucoes.style.display = "block";
  }
}

// Limpar interface
function limparInterface() {
  downloads.innerHTML = "";
  linksParaDownload = [];
  blobsParaUpload = [];
  btnBaixarTudo.style.display = "none";
  btnUploadTudo.style.display = "none";
  instrucoes.style.display = "none";
  linksPublicos.style.display = "none";
}

// Mostrar erro
function mostrarErro(mensagem) {
  const erroDiv = document.createElement("div");
  erroDiv.className = "erro-msg";
  erroDiv.textContent = mensagem;
  downloads.appendChild(erroDiv);
  
  setTimeout(() => erroDiv.remove(), 5000);
}

// Drag & Drop
dropzone.addEventListener("dragover", e => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    processarArquivos(e.dataTransfer.files);
  }
});

dropzone.addEventListener("click", () => {
  input.click();
});

// Input
input.addEventListener("change", () => {
  if (input.files.length > 0) {
    processarArquivos(input.files);
  }
});

// Ctrl+V
window.addEventListener("paste", e => {
  const arquivos = [];
  for (const item of e.clipboardData.items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) arquivos.push(file);
    }
  }
  if (arquivos.length > 0) {
    processarArquivos(arquivos);
  }
});

// Baixar tudo
btnBaixarTudo.addEventListener("click", () => {
  linksParaDownload.forEach((link, i) => {
    setTimeout(() => link.click(), i * 100);
  });
});

// Upload para ImgBB
btnUploadTudo.addEventListener("click", async () => {
  loading.style.display = "block";
  linksPublicos.style.display = "none";
  listaLinks.innerHTML = "";
  progressoUpload.textContent = "";

  const API_KEY = "be2bda19e98f53801c62094133672330";
  const linksGerados = [];
  const total = blobsParaUpload.length;

  for (let i = 0; i < total; i++) {
    const { blob, nome } = blobsParaUpload[i];
    progressoUpload.textContent = `Enviando ${i + 1} de ${total}...`;
    
    try {
      const base64 = await blobToBase64(blob);
      const base64Data = base64.split(",")[1];
      const formData = new FormData();
      formData.append("image", base64Data);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      
      if (data.success) {
        linksGerados.push({
          nome,
          url: data.data.url,
          deleteUrl: data.data.delete_url
        });
      } else {
        console.error(`Erro ao fazer upload de ${nome}:`, data);
      }
    } catch (err) {
      console.error(`Erro ao fazer upload de ${nome}:`, err);
    }
  }

  loading.style.display = "none";
  
  if (linksGerados.length > 0) {
    exibirLinksPublicos(linksGerados);
  } else {
    mostrarErro("Erro ao fazer upload. Tente novamente mais tarde.");
  }
});

// Converter blob para base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Exibir links públicos
function exibirLinksPublicos(links) {
  linksPublicos.style.display = "block";
  listaLinks.innerHTML = "";

  links.forEach((item, idx) => {
    const div = document.createElement("div");
    div.className = "link-item";

    const titulo = document.createElement("strong");
    titulo.textContent = `${idx + 1}. ${item.nome}`;

    const divLink = document.createElement("div");
    divLink.className = "link-copiavel";

    const inputLink = document.createElement("input");
    inputLink.type = "text";
    inputLink.value = item.url;
    inputLink.readOnly = true;

    const btnCopiar = document.createElement("button");
    btnCopiar.className = "btn-copiar";
    btnCopiar.textContent = "📋 Copiar";
    btnCopiar.onclick = () => {
      inputLink.select();
      navigator.clipboard.writeText(item.url).then(() => {
        btnCopiar.textContent = "✅ Copiado!";
        btnCopiar.classList.add("copiado");
        setTimeout(() => {
          btnCopiar.textContent = "📋 Copiar";
          btnCopiar.classList.remove("copiado");
        }, 2000);
      });
    };

    divLink.appendChild(inputLink);
    divLink.appendChild(btnCopiar);

    const preview = document.createElement("div");
    preview.className = "link-preview";
    const imgPreview = document.createElement("img");
    imgPreview.src = item.url;
    imgPreview.alt = item.nome;
    preview.appendChild(imgPreview);

    div.appendChild(titulo);
    div.appendChild(divLink);
    div.appendChild(preview);

    listaLinks.appendChild(div);
  });
}
