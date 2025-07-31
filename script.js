const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");
const dropzone = document.getElementById("dropzone");

let linksParaDownload = [];

function processarArquivos(files) {
  const imagens = Array.from(files).filter(file => file.type.startsWith("image/")).slice(0, 10);

  if (imagens.length === 0) return;

  downloads.innerHTML = "";
  linksParaDownload = [];
  btnBaixarTudo.style.display = "none";

  imagens.forEach((file) => {
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
          link.download = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          link.href = URL.createObjectURL(blob);
          link.textContent = `Download: ${link.download}`;
          downloads.appendChild(link);
          linksParaDownload.push(link);

          if (linksParaDownload.length === imagens.length) {
            btnBaixarTudo.style.display = "inline-block";
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
  linksParaDownload.forEach(link => link.click());
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
