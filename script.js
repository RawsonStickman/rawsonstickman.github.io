const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");
const dropzone = document.getElementById("dropzone");
const instrucoes = document.getElementById("instrucoes");

let linksParaDownload = [];

function processarArquivos(files) {
  const imagens = Array.from(files).filter(file => file.type.startsWith("image/")).slice(0, 10);

  if (imagens.length === 0) return;

  downloads.innerHTML = "";
  linksParaDownload = [];
  btnBaixarTudo.style.display = "none";
  instrucoes.style.display = "none";

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
          
          // Criar card da imagem
          const card = document.createElement("div");
          card.className = "image-card";
          
          // Criar link com imagem (para copiar o endereço)
          const linkImagem = document.createElement("a");
          linkImagem.href = url;
          linkImagem.download = nomeArquivo;
          
          // Criar elemento de imagem
          const imgPreview = document.createElement("img");
          imgPreview.src = url;
          imgPreview.className = "image-preview";
          imgPreview.alt = nomeArquivo;
          imgPreview.title = "Clique com botão direito → Copiar endereço do link";
          
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
            instrucoes.style.display = "block";
          }
        }, "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    }, index * 100); // Pequeno delay entre downloads
  });
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
