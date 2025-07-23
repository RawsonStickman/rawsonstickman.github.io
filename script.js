const input = document.getElementById("input");
const downloads = document.getElementById("downloads");
const btnBaixarTudo = document.getElementById("baixarTudo");

let linksParaDownload = [];

input.addEventListener("change", () => {
  downloads.innerHTML = "";
  linksParaDownload = [];
  btnBaixarTudo.style.display = "none";

  const files = Array.from(input.files).slice(0, 10);

  files.forEach((file, index) => {
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

        canvas.toBlob(
          (blob) => {
            const link = document.createElement("a");
            const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            link.download = nomeArquivo;
            link.href = URL.createObjectURL(blob);
            link.textContent = `Download: ${link.download}`;
            downloads.appendChild(link);
            linksParaDownload.push(link);

            if (linksParaDownload.length === files.length) {
              btnBaixarTudo.style.display = "inline-block";
            }
          },
          "image/jpeg",
          0.8
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
});

btnBaixarTudo.addEventListener("click", () => {
  linksParaDownload.forEach((link) => {
    link.click();
  });
});
