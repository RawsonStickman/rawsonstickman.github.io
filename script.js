window.addEventListener("load", () => {
  if (typeof Tiff === "undefined") {
    alert("Biblioteca TIFF não carregada!");
    return;
  }

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
      .filter(f => f.type.startsWith("image/") || f.name.toLowerCase().endsWith(".tif") || f.name.toLowerCase().endsWith(".tiff"))
      .slice(0,10);

    if(imagens.length===0) return;

    downloads.innerHTML = "";
    linksParaDownload = [];
    blobsParaUpload = [];
    btnBaixarTudo.style.display = "none";
    btnUploadTudo.style.display = "none";
    instrucoes.style.display = "none";
    linksPublicos.style.display = "none";

    imagens.forEach(file => {
      const reader = new FileReader();
      const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");

      reader.onload = (e) => {
        if(isTiff){
          try{
            const tiff = new Tiff({ buffer: e.target.result });
            const canvas = tiff.toCanvas();
            if(!canvas){ alert(`Erro ao abrir ${file.name}`); return; }
            canvas.toBlob(blob => criarCard(canvas, blob, file), "image/jpeg", 0.8);
          } catch(err){
            alert(`Erro ao processar ${file.name}: ${err.message}`);
          }
        } else {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "white";
            ctx.fillRect(0,0,canvas.width,canvas.height);
            ctx.drawImage(img,0,0);
            canvas.toBlob(blob => criarCard(canvas, blob, file), "image/jpeg", 0.8);
          };
          img.src = e.target.result;
        }
      };

      if(isTiff) reader.readAsArrayBuffer(file);
      else reader.readAsDataURL(file);
    });
  }

  function criarCard(canvas, blob, file){
    const url = URL.createObjectURL(blob);
    const nomeArquivo = file.name.replace(/\.[^/.]+$/,"")+".jpg";
    blobsParaUpload.push({ blob, nome: nomeArquivo });

    const card = document.createElement("div");
    card.className = "image-card";

    const linkImagem = document.createElement("a");
    linkImagem.href = url;
    linkImagem.download = nomeArquivo;

    const imgPreview = document.createElement("img");
    imgPreview.src = url;
    imgPreview.className = "image-preview";
    linkImagem.appendChild(imgPreview);

    const linkDownload = document.createElement("a");
    linkDownload.href = url;
    linkDownload.download = nomeArquivo;
    linkDownload.className = "image-link";
    linkDownload.textContent = `⬇️ ${nomeArquivo}`;

    const info = document.createElement("div");
    info.className = "image-info";
    info.textContent = `${canvas.width}x${canvas.height} • ${(blob.size/1024).toFixed(2)} KB`;

    card.appendChild(linkImagem);
    card.appendChild(linkDownload);
    card.appendChild(info);

    downloads.appendChild(card);
    linksParaDownload.push(linkDownload);

    if(linksParaDownload.length===blobsParaUpload.length){
      btnBaixarTudo.style.display = "inline-block";
      btnUploadTudo.style.display = "inline-block";
      instrucoes.style.display = "block";
    }
  }

  // Drag & drop
  dropzone.addEventListener("dragover", e => { e.preventDefault(); dropzone.classList.add("dragover"); });
  dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
  dropzone.addEventListener("drop", e => { 
    e.preventDefault(); 
    dropzone.classList.remove("dragover"); 
    processarArquivos(e.dataTransfer.files); 
  });

  // Input
  input.addEventListener("change", () => processarArquivos(input.files));

  // Paste
  window.addEventListener("paste", e => {
    const arquivos = [];
    for(const item of e.clipboardData.items){
      if(item.type.startsWith("image/")) arquivos.push(item.getAsFile());
    }
    if(arquivos.length>0) processarArquivos(arquivos);
  });

  // Baixar tudo
  btnBaixarTudo.addEventListener("click", ()=> linksParaDownload.forEach((l,i)=>setTimeout(()=>l.click(),i*100)));

  // Upload
  btnUploadTudo.addEventListener("click", async () => {
    loading.style.display = "block";
    linksPublicos.style.display = "none";
    listaLinks.innerHTML = "";

    const API_KEY = "be2bda19e98f53801c62094133672330";
    const linksGerados = [];

    for(let {blob,nome} of blobsParaUpload){
      try{
        const base64 = await blobToBase64(blob);
        const base64Data = base64.split(",")[1];
        const formData = new FormData();
        formData.append("image", base64Data);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`,{method:"POST",body:formData});
        const data = await res.json();
        if(data.success) linksGerados.push({nome, url:data.data.url, deleteUrl:data.data.delete_url});
      }catch(err){ console.error(err); }
    }

    loading.style.display = "none";
    if(linksGerados.length>0) exibirLinks(linksGerados);
    else alert("Erro ao fazer upload.");
  });

  function blobToBase64(blob){
    return new Promise((res,rej)=>{
      const r = new FileReader();
      r.onloadend = ()=>res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  }

  function exibirLinks(links){
    linksPublicos.style.display = "block";
    listaLinks.innerHTML="";
    links.forEach((item,i)=>{
      const div = document.createElement("div");
      div.className = "link-item";
      const titulo = document.createElement("strong");
      titulo.textContent = `${i+1}. ${item.nome}`;
      const divLink = document.createElement("div");
      divLink.className = "link-copiavel";
      const inputLink = document.createElement("input");
      inputLink.value = item.url; inputLink.readOnly=true;
      const btnCopiar = document.createElement("button");
      btnCopiar.textContent="📋 Copiar";
      btnCopiar.className="btn-copiar";
      btnCopiar.onclick=()=>{
        inputLink.select();
        navigator.clipboard.writeText(item.url);
        btnCopiar.textContent="✅ Copiado!";
        setTimeout(()=>btnCopiar.textContent="📋 Copiar",2000);
      };
      divLink.appendChild(inputLink); divLink.appendChild(btnCopiar);
      const preview = document.createElement("div"); preview.className="link-preview";
      const imgPreview = document.createElement("img"); imgPreview.src=item.url;
      preview.appendChild(imgPreview);
      div.appendChild(titulo); div.appendChild(divLink); div.appendChild(preview);
      listaLinks.appendChild(div);
    });
  }

});
