/*!
 * script.js
 * Versão: 1.2.0
 * Última atualização: 31/10/2025
 * Usando UTIF.js para melhor compatibilidade com TIFF
 */

const SCRIPT_VERSION = "1.2.0";
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
let utifCarregado = false;

// Verificar se biblioteca UTIF carregou
window.addEventListener('load', () => {
  setTimeout(() => {
    utifCarregado = typeof UTIF !== "undefined";
    if (utifCarregado) {
      console.log("✅ Biblioteca UTIF carregada com sucesso!");
    } else {
      console.error("❌ Biblioteca UTIF não foi carregada.");
      mostrarErro("Biblioteca TIFF não carregada. Arquivos .tif/.tiff não serão suportados.");
    }
  }, 1000);
});

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

  imagens.forEach(file => {
    const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");
    
    if (isTiff && !utifCarregado) {
      mostrarErro(`Arquivo TIFF não suportado: ${file.name}. Recarregue a página e tente novamente.`);
      processadas++;
      if (processadas === total) finalizarProcessamento();
      return;
    }

    const reader = new FileReader();

    reader.onload = async e => {
      try {
        if (isTiff) {
          await processarTiffComUTIF(e.target.result, file.name, () => {
            processadas++;
            if (processadas === total) finalizarProcessamento();
          });
        } else {
          await processarImagemNormal(e.target.result, file.name, () => {
            processadas++;
            if (processadas === total) finalizarProcessamento();
          });
        }
      } catch (err) {
        console.error(`Erro ao processar ${file.name}:`, err);
        mostrarErro(`Erro ao processar ${file.name}: ${err.message}`);
        processadas++;
        if (processadas === total) finalizarProcessamento();
      }
    };

    reader.onerror = () => {
      mostrarErro(`Erro ao ler arquivo: ${file.name}`);
      processadas++;
      if (processadas === total) finalizarProcessamento();
    };

    if (isTiff) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

// Processar arquivo TIFF usando UTIF.js
async function processarTiffComUTIF(arrayBuffer, nomeOriginal, callback) {
  return new Promise((resolve, reject) => {
    try {
      // Decodificar TIFF
      const ifds = UTIF.decode(arrayBuffer);
      UTIF.decodeImage(arrayBuffer, ifds[0]);
      
      const rgba = UTIF.toRGBA8(ifds[0]);
      const width = ifds[0].width;
      const height = ifds[0].height;

      // Criar canvas e desenhar a imagem
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      const imageData = ctx.createImageData(width, height);
      imageData.data.set(rgba);
      ctx.putImageData(imageData, 0, 0);

      // Converter para JPG
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error("Erro ao converter TIFF para JPG"));
          return;
        }

        const url = URL.createObjectURL(blob);
        const nomeArquivo = nomeOriginal.replace(/\.[^/.]+$/, "") + ".jpg";
        blobsParaUpload.push({ blob, nome: nomeArquivo });

        const card = criarCardImagem(url, nomeArquivo, blob, width, height);
        downloads.appendChild(card);
        linksParaDownload.push(card.querySelector(".image-link"));
        
        callback();
        resolve();
      }, "image/jpeg", QUALIDADE_JPG);

    } catch (err) {
      reject(err);
    }
  });
}

// Processar imagem normal
async function processarImagemNormal(dataUrl, nomeOriginal, callback) {
  return new Promise((resolve, reject) => {
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
        const url = URL.createObjectURL(blob);
        const nomeArquivo = nomeOriginal.replace(/\.[^/.]+$/, "") + ".jpg";
        blobsParaUpload.push({ blob, nome: nomeArquivo });

        const card = criarCardImagem(url, nomeArquivo, blob, img.width, img.height);
        downloads.appendChild(card);
        linksParaDownload.push(card.querySelector(".image-link"));
        
        callback();
        resolve();
      }, "image/jpeg", QUALIDADE_JPG);
    };

    img.onerror = () => reject(new Error("Erro ao carregar imagem"));
    img.src = dataUrl;
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

console.log(`Script carregado - Versão ${SCRIPT_VERSION}`);
