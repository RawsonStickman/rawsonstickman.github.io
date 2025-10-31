// Importante: no HTML, adicione antes deste script:
// <script src="https://cdn.jsdelivr.net/npm/utif@3.1.0/UTIF.min.js"></script>

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
  const imagens = Array.from(files).filter(file =>
    file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff")
  ).slice(0, 10);

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
      const buffer = e.target.result;

      // Detectar se é TIFF
      const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");

      if (isTiff) {
        try {
          const tiff = new Tiff({ buffer });
          const canvas = tiff.toCanvas();
          if (canvas) {
            canvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + ".jpg";

              blobsParaUpload.push({ blob, nome: nomeArquivo });
              
              const card = criarCardImagem(url, nomeArquivo, blob, canvas.width, canvas.height);
              downloads.appendChild(card);
              linksParaDownload.push(card.querySelector(".image-link"));

              if (linksParaDownload.length === imagens.length) {
                btnBaixarTudo.style.display = "inline-block";
                btnUploadTudo.style.display = "inline-block";
                instrucoes.style.display = "block";
              }
            }, "image/jpeg", 0.8);
          } else {
            alert(`Não foi possível abrir o arquivo ${file.name}. Pode estar corrompido ou usar compressão não suportada.`);
          }
        } catch (err) {
          alert(`Erro ao processar ${file.name}: ${err.message}`);
        }
      } else {
        // Processamento normal para PNG/JPG
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

            const card = criarCardImagem(url, nomeArquivo, blob, img.width, img.height);
            downloads.appendChild(card);
            linksParaDownload.push(card.querySelector(".image-link"));

            if (linksParaDownload.length === imagens.length) {
              btnBaixarTudo.style.display = "inline-block";
              btnUploadTudo.style.display = "inline-block";
              instrucoes.style.display = "block";
            }
          }, "image/jpeg", 0.8);
        };
        img.src = e.target.result;
      }
    };
    reader.readAsArrayBuffer(file); // importante: TIFF precisa de ArrayBuffer
  });
}

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
