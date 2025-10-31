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

if (file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff")) {
  // Ler como ArrayBuffer para TIFF
  reader.onload = (e) => {
    const buffer = e.target.result;
    const ifds = UTIF.decode(buffer);
    UTIF.decodeImages(buffer, ifds);
    const rgba = UTIF.toRGBA8(ifds[0]);

    const canvas = document.createElement("canvas");
    canvas.width = ifds[0].width;
    canvas.height = ifds[0].height;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(ifds[0].width, ifds[0].height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);

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
    }, "image/jpeg", 0.8);
  };
  reader.readAsArrayBuffer(file);
} else {
  // comportamento padrão para PNG/JPG
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
