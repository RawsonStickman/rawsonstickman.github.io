const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");
const btnUploadTudo = document.getElementById("uploadTudo");
const dropzone = document.getElementById("dropzone");
const instrucoes = document.getElementById("instrucoes");
const loading = document.getElementById("loading");
const linksPublicos = document.getElementById("linksPublicos");
const listaLinks = document.getElementById("listaLinks");

let linksParaDownload = [];
let blobsParaUpload = [];

function processarArquivos(files) {
  const imagens = Array.from(files).filter(file => file.type.startsWith("image/")).slice(0, 10);

  if (imagens.length === 0) return;

  downloads.innerHTML = "";
  linksParaDownload = [];
  blobsParaUpload = [];
  btnBaixarTudo.style.display = "none";
  btnUploadTudo.style.display = "none";
  instrucoes.style.display = "none";
  linksPublicos.style.display = "none";

  imagens.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // Fundo branco para PNGs transparentes
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          
          // Armazenar blob para upload posterior
          blobsParaUpload.push({ blob, nome: nomeArquivo });
          
          // Criar card da imagem
          const card = document.createElement("div");
          card.className = "image-card";
          
          // Criar link com imagem
          const linkImagem = document.createElement("a");
          linkImagem.href = url;
          linkImagem.download = nomeArquivo;
          
          // Criar elemento de imagem
          const imgPreview = document.createElement("img");
          imgPreview.src = url;
          imgPreview.className = "image-preview";
          imgPreview.alt = nomeArquivo;
          
          // Adicionar imagem ao link
          linkImagem.appendChild(imgPreview);
          
          // Criar botão de download
          const linkDownload = document.createElement("a");
          linkDownload.href = url;
          linkDownload.download = nomeArquivo;
          linkDownload.className = "image-link";
          linkDownload.textContent = `⬇️ ${nomeArquivo}`;
          
          // Informações da imagem
          const info = document.createElement("div");
          info.className = "image-info";
          const tamanhoKB = (blob.size / 1024).toFixed(2);
          info.textContent = `${img.width}x${img.height} • ${tamanhoKB} KB`;
          
          // Montar o card
          card.appendChild(linkImagem);
          card.appendChild(linkDownload);
          card.appendChild(info);
          
          downloads.appendChild(card);
          linksParaDownload.push(linkDownload);

          if (linksParaDownload.length === imagens.length) {
            btnBaixarTudo.style.display = "inline-block";
            btnUploadTudo.style.display = "inline-block";
            instrucoes.style.display = "block";
          }
        }, "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Função para fazer upload usando imgbb.com (API gratuita)
async function fazerUploadImagens() {
  loading.style.display = "block";
  linksPublicos.style.display = "none";
  listaLinks.innerHTML = "";

  // API Key pública do imgbb (você pode criar sua própria em https://api.imgbb.com/)
  const API_KEY = "be2bda19e98f53801c62094133672330"; // Substitua por sua chave
  
  const linksGerados = [];

  for (let i = 0; i < blobsParaUpload.length; i++) {
    const { blob, nome } = blobsParaUpload[i];
    
    try {
      // Converter blob para base64
      const base64 = await blobToBase64(blob);
      const base64Data = base64.split(',')[1]; // Remove o prefixo data:image/jpeg;base64,
      
      // Fazer upload para imgbb
      const formData = new FormData();
      formData.append('image', base64Data);
      
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        linksGerados.push({
          nome: nome,
          url: data.data.url,
          deleteUrl: data.data.delete_url
        });
      } else {
        console.error('Erro no upload:', data);
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
    }
  }
  
  loading.style.display = "none";
  
  if (linksGerados.length > 0) {
    exibirLinksPublicos(linksGerados);
  } else {
    alert('Erro ao fazer upload. Tente usar outro serviço de hospedagem de imagens como imgur.com, postimages.org ou imgbb.com manualmente.');
  }
}

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
  
  links.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "link-item";
    
    const titulo = document.createElement("strong");
    titulo.textContent = `${index + 1}. ${item.nome}`;
    
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
      navigator.clipboard.writeText(item.url);
      btnCopiar.textContent = "✅ Copiado!";
      btnCopiar.classList.add("copiado");
      setTimeout(() => {
        btnCopiar.textContent = "📋 Copiar";
        btnCopiar.classList.remove("copiado");
      }, 2000);
    };
    
    divLink.appendChild(inputLink);
    divLink.appendChild(btnCopiar);
    
    // Preview da imagem
    const preview = document.createElement("div");
    preview.className = "link-preview";
    const imgPreview = document.createElement("img");
    imgPreview.src = item.url;
    preview.appendChild(imgPreview);
    
    div.appendChild(titulo);
    div.appendChild(divLink);
    div.appendChild(preview);
    
    listaLinks.appendChild(div);
  });
}

// Input tradicional
input.addEventListener("change", () => {
  processarArquivos(input.files);
});

// Baixar tudo
btnBaixarTudo.addEventListener("click", () => {
  linksParaDownload.forEach((link, index) => {
    setTimeout(() => {
      link.click();
    }, index * 100);
  });
});

// Upload tudo
btnUploadTudo.addEventListener("click", () => {
  fazerUploadImagens();
});

// Arrastar e soltar
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});

dropzone.addEventListener("dragleave", () => {
  dropzone.classList.remove("dragover");
});

dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) {
    processarArquivos(e.dataTransfer.files);
  }
});

// Colar imagens (Ctrl+V)
window.addEventListener("paste", (e) => {
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
