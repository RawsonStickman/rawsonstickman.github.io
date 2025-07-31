const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");
const dropzone = document.getElementById("dropzone");

let linksParaDownload = [];

function processarArquivos(files) {
  const validFiles = Array.from(files).slice(0, 10);

  downloads.innerHTML = "";
  linksParaDownload = [];
  btnBaixarTudo.style.display = "none";

  validFiles.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      alert(`Arquivo ignorado: ${file.name} não é uma imagem.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          const link = document.createElement("a");
          const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          link.download = nomeArquivo;
          link.href = URL.createObjectURL(blob);
          link.textContent = `Download: ${link.download}`;
          downloads.appendChild(link);
          linksParaDownload.push(link);

          if (linksParaDownload.length === validFiles.length) {
            btnBaixarTudo.style.display = "inline-block";
          }
        }, "image/jpeg", 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

input.addEventListener("change", () => {
  processarArquivos(input.files);
});

btnBaixarTudo.addEventListener("click", () => {
  linksParaDownload.forEach((link) => link.click());
});

// Arrastar e soltar
dropzone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropzone.style.background = "#eee";
});
dropzone.addEventListener("dragleave", () => {
  dropzone.style.background = "#fff";
});
dropzone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropzone.style.background = "#fff";
  processarArquivos(e.dataTransfer.files);
});

// Colar imagens
window.addEventListener("paste", (e) => {
  const items = e.clipboardData.items;
  const arquivos = [];
  for (let item of items) {
    if (item.type.startsWith("image/")) {
      arquivos.push(item.getAsFile());
    }
  }
  if (arquivos.length > 0) {
    processarArquivos(arquivos);
  }
});
