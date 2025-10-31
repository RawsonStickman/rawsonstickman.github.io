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
  const imagens = Array.from(files)
    .filter(file =>
      file.type.startsWith("image/") ||
      file.name.toLowerCase().endsWith(".tif") ||
      file.name.toLowerCase().endsWith(".tiff")
    )
    .slice(0, 10);

  if (imagens.length === 0) return;

  downloads.innerHTML = "";
  linksParaDownload = [];
  blobsParaUpload = [];
  btnBaixarTudo.style.display = "none";
  btnUploadTudo.style.display = "none";
  instrucoes.style.display = "none";
  linksPublicos.style.display = "none";

  imagens.forEach((file) => {
    const reader = new FileReader();

    // Caso seja TIFF/TIF
    if (file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff")) {
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const ifds = UTIF.decode(buffer);
          if (!ifds || ifds.length === 0) throw new Error("TIFF inválido");
          UTIF.decodeImages(buffer, ifds);
          const first = ifds[0];
          const rgba = UTIF.toRGBA8(first);

          const canvas = document.createElement("canvas");
          canvas.width = first.width;
          canvas.height = first.height;
          const ctx = canvas.getContext("2d");
          const imageData = ctx.createImageData(first.width, first.height);
          imageData.data.set(rgba);
          ctx.putImageData(imageData, 0, 0);

          canvas.toBlob((blob) => {
            if (!blob) {
              alert("Falha ao converter TIFF. Tente outro arquivo.");
              return;
            }

            const url = URL.createObjectURL(blob);
            const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            blobsParaUpload.push({ blob, nome: nomeArquivo });

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
            info.textContent = `${canvas.width}x${canvas.height} • ${tamanhoKB} KB`;

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
          }, "image/jpeg", 0.85);
        } catch (err) {
          console.error("Erro ao decodificar TIFF:", err);
          alert("Não foi possível abrir o arquivo TIFF. Pode estar corrompido ou usar compressão não suportada.");
        }
      };
      reader.readAsArrayBuffer(file);

    } else {
      // Padrão: PNG, JPG, etc.
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

            blobsParaUpload.push({ blob, nome: nomeArquivo });

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
            info.textContent = `${img.width}x${img.height} • ${tamanhoKB} KB`;

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
    }
  });
}

// Upload no imgbb
async function fazerUploadImagens() {
  loading.style.display = "block";
  linksPublicos.style.display = "none";
  listaLinks.innerHTML = "";

  const API_KEY = "be2bda19e98f53801c62094133672330"; // sua chave

  const linksGerados = [];

  for (let i = 0; i < blobsParaUpload.length; i++) {
    const { blob, nome } = blobsParaUpload[i];
    try {
      const base64 = await blobToBase64(blob);
      const base64Data = base64.split(',')[1];
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
    alert('Erro ao fazer upload. Tente outro serviço de hospedagem de imagens.');
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

// Eventos
input.addEventListener("change", () => processarArquivos(input.files));
btnBaixarTudo.addEventListener("click", () => {
  linksParaDownload.forEach((link, index) => setTimeout(() => link.click(), index * 100));
});
btnUploadTudo.addEventListener("click", () => fazerUploadImagens());

dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.classList.add("dragover");
});
dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.classList.remove("dragover");
  if (e.dataTransfer.files.length > 0) processarArquivos(e.dataTransfer.files);
});

window.addEventListener("paste", (e) => {
  const arquivos = [];
  for (const item of e.clipboardData.items) {
    if (item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) arquivos.push(file);
    }
  }
  if (arquivos.length > 0) processarArquivos(arquivos);
});
