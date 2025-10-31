// UTIF.js - Biblioteca completa para processar TIFF
// Salve este arquivo como "UTIF.js" na mesma pasta do projeto

(function(UTIF) {
  
UTIF.decode = function(buff) {
  var data = new Uint8Array(buff), offset = 0;
  var id = UTIF._binBE.readUshort(data, offset);  offset+=2;
  var ifds = [];
  
  if(id==0x4949) UTIF._binLE.readIFD(data, UTIF._binLE.readUint(data, offset), ifds, 0, UTIF._binLE);
  else           UTIF._binBE.readIFD(data, UTIF._binBE.readUint(data, offset), ifds, 0, UTIF._binBE);
  return ifds;
}

UTIF.decodeImage = function(buff, img, ifds)
{
  if(img.data) return;
  var data = new Uint8Array(buff);
  var id = UTIF._binBE.readUshort(data, 0);
  img.isLE = (id==0x4949);
  img.width  = img.t256[0];
  img.height = img.t257[0];
  
  var cmpr = img.t259 ? img.t259[0] : 1;
  var fo = img.t266 ? img.t266[0] : 1;
  
  if(img.t284 && img.t284[0]==2) console.log("PlanarConfiguration 2 should not be used!");
  
  var bipp;
  if(img.t258) bipp = Math.min(32, img.t258[0]);
  else bipp = (img.t277 ? img.t277[0] : 1) * 8;
  
  var bipl = (img.t277 ? img.t277[0] : 1);
  var spp = (img.t277 ? img.t277[0] : 1);
  
  img.data = new Uint8Array( img.height * img.width * 4 );
  
  var bps = (img.t258?img.t258:[bipp]); 
  var noc = (img.t277?img.t277[0]:1), i=0;
  var bpl = Math.ceil(bipp*img.width/8);
  
  var boff = img.t273;
  var bcnt = img.t279;
  
  var bytes = new Uint8Array(bpl * img.height), bilen = 0;
  
  if(img.t322!=null) {
    var tw = img.t322[0], th = img.t323[0];
    var tx = Math.floor((img.width  + tw - 1) / tw);
    var ty = Math.floor((img.height + th - 1) / th);
    var tbuff = new Uint8Array(Math.ceil(tw*th*bipp/8)|0);
    for(var y=0; y<ty; y++) {
      for(var x=0; x<tx; x++) {
        var toff = (y*tx+x);
        for(var j=0; j<tbuff.length; j++) tbuff[j]=0;
        UTIF.decode._decompress(img, data, boff[toff], bcnt[toff], cmpr, tbuff, 0);
        
        var xlim = Math.min(tw, img.width -x*tw);
        var ylim = Math.min(th, img.height-y*th);
        for(var j=0; j<ylim; j++) {
          var tof = (j*tw)*bipp>>>3, dof = (((y*th+j)*img.width) + x*tw)*bipp>>>3;
          for(var i=0; i<(xlim*bipp>>>3); i++) bytes[dof+i] = tbuff[tof+i];
        }
      }
    }
  } else {
    var rps = img.t278 ? img.t278[0] : img.height;
    rps = Math.min(rps, img.height);
    for(var i=0; i<boff.length; i++) {
      UTIF.decode._decompress(img, data, boff[i], bcnt[i], cmpr, bytes, bilen);
      bilen += Math.floor((rps*bpl+7)/8)<<3;
    }
  }
  
  var bitsPerPixel = bps[0];
  var alphaChannel = (noc==4 && img.t262[0]==2);
  
  if(false) {}
  else if(img.t262[0]==0 || img.t262[0]==1) {
    var invert = img.t262[0]==0;
    if(bitsPerPixel==1) {
      for(var y=0; y<img.height; y++) {
        var off = y*img.width, io = y*bpl;
        for(var x=0; x<img.width; x++) {
          var qi = io+(x>>>3), px = bytes[qi];
          px = (px>>>(7-(x&7)))&1;
          if(invert) px = 1-px;
          px = px*255;
          var oi = (off+x)<<2;
          img.data[oi] = px; img.data[oi+1] = px; img.data[oi+2] = px; img.data[oi+3] = 255;
        }
      }
    }
    else if(bitsPerPixel==4) {
      for(var y=0; y<img.height; y++) {
        var off = y*img.width, io = y*bpl;
        for(var x=0; x<img.width; x++) {
          var qi = io+(x>>>1), px = bytes[qi];
          px = (x&1)==0 ? (px>>>4) : (px&15);
          if(invert) px = 15-px;
          px = (px/15)*255;
          var oi = (off+x)<<2;
          img.data[oi] = px; img.data[oi+1] = px; img.data[oi+2] = px; img.data[oi+3] = 255;
        }
      }
    }
    else if(bitsPerPixel==8) {
      for(var y=0; y<img.height; y++) {
        var off = y*img.width, io = y*bpl;
        for(var x=0; x<img.width; x++) {
          var px = bytes[io+x];
          if(invert) px = 255-px;
          var oi = (off+x)<<2;
          img.data[oi] = px; img.data[oi+1] = px; img.data[oi+2] = px; img.data[oi+3] = 255;
        }
      }
    }
    else console.log("unsupported bit depth", bitsPerPixel);
  }
  else if(img.t262[0]==2) {
    if(bitsPerPixel==8) {
      var spl = bpl/noc;
      for(var y=0; y<img.height; y++) {
        var off = y*img.width, io = y*bpl;
        for(var x=0; x<img.width; x++) {
          var oi = (off+x)<<2, xi = io+x*noc;
          img.data[oi  ] = bytes[xi  ];
          img.data[oi+1] = bytes[xi+1];
          img.data[oi+2] = bytes[xi+2];
          img.data[oi+3] = noc==4 ? bytes[xi+3] : 255;
        }
      }
    } else console.log("unsupported bit depth", bitsPerPixel);
  }
  else if(img.t262[0]==3) {
    var map = img.t320;
    for(var y=0; y<img.height; y++) {
      var off = y*img.width, io = y*bpl;
      for(var x=0; x<img.width; x++) {
        var qi = io+(x>>>3), px = bytes[qi];
        px = (px>>>(7-(x&7)))&1;
        var oi = (off+x)<<2;
        img.data[oi] = (map[px]>>8); img.data[oi+1] = (map[256+px]>>8); img.data[oi+2] = (map[512+px]>>8); img.data[oi+3] = 255;
      }
    }
  }
  else console.log("Unknown Photometric interpretation: "+img.t262[0]);
}

UTIF.toRGBA8 = function(img) {
  var w = img.width, h = img.height, area = w*h, qarea = area*4;
  var data = img.data, alpha = false;
  
  if(img.t262[0]==0) {
    for(var i=0; i<area; i++) {
      var qi=i<<2, px = 255-data[qi];
      data[qi] = px; data[qi+1] = px; data[qi+2] = px;
    }
  }
  return img.data;
}

UTIF.decode._decompress = function(img, data, off, len, cmpr, tgt, toff) {
  if(cmpr==1) for(var j=0; j<len; j++) tgt[toff+j] = data[off+j];
  else if(cmpr==3) UTIF.decode._decodeG3 (data, off, len, tgt, toff, img.width);
  else if(cmpr==4) UTIF.decode._decodeG4 (data, off, len, tgt, toff, img.width);
  else if(cmpr==5) UTIF.decode._decodeLZW(data, off, tgt, toff);
  else if(cmpr==6) UTIF.decode._decodeOldJPEG(img, data, off, len, tgt, toff);
  else if(cmpr==7) UTIF.decode._decodeNewJPEG(img, data, off, len, tgt, toff);
  else if(cmpr==32773) UTIF.decode._decodePackBits(data, off, len, tgt, toff);
  else if(cmpr==32809) UTIF.decode._decodeThunder (data, off, len, tgt, toff);
  else console.log("Unknown compression", cmpr);
}

UTIF.decode._decodePackBits = function(data, off, len, tgt, toff) {
  var sa = new Int8Array(data.buffer,off,len), ta = new Int8Array(tgt.buffer, toff);
  var pt = 0;
  for(var i=0; i<len; i++) {
    var b = sa[i];
    if(b>=0 && b<=127) for(var j=0; j< b+1; j++) ta[pt++]=sa[++i];
    if(b<=-1 && b>=-127) { var val=sa[++i]; for(var j=0; j<1-b; j++) ta[pt++]=val; }
  }
}

UTIF.decode._decodeLZW = function(data, off, tgt, toff) {
  var lzwTab = {  "position":0, "clear":256, "end":257, "bits":9, "bitsLeft":0, "curByte":0 };
  var dict = new Uint16Array(4096*2), dictLen = 258, pval = -1, val = 0;
  for(var i=0; i<256; i++) { dict[2*i]=i; dict[2*i+1]=i; }
  
  var tlen = 0;
  while(true) {
    val = UTIF.decode._lzwRead(lzwTab, data, off);
    if(val==lzwTab.end) break;
    if(val==lzwTab.clear) {
      dictLen = 258;  pval = -1;  lzwTab.bits = 9;  continue;
    }
    if(pval==-1) { tgt[toff + (tlen++)] = val; pval=val; continue; }
    
    var tIndex = 2*val, pIndex = 2*pval;
    if(val>=dictLen) { 
      tIndex = 2*dictLen; dict[tIndex] = pIndex>>>1; dict[tIndex+1] = dict[pIndex+1];  
    }
    var len = 0, index = tIndex;
    while(dict[index+1]!=index>>>1) { len++; index=2*dict[index+1]; }
    var base = toff+tlen+len; tgt[base] = dict[index];
    for(var i=0; i<=len; i++) { tgt[base-i] = dict[tIndex]; tIndex=2*dict[tIndex+1]; }
    tlen += len+1;
    
    if(dictLen<4096) {
      dict[2*dictLen] = pIndex>>>1;  dict[2*dictLen+1] = dict[pIndex+1];
      dictLen++;
      if(dictLen+1==(1<<lzwTab.bits) && lzwTab.bits!=12) lzwTab.bits++;
    }
    pval = val;
  }
}

UTIF.decode._lzwRead = function(tab, data, off) {
  while(tab.bitsLeft<tab.bits) {
    tab.curByte = (tab.curByte<<8) | data[off + (tab.position++)];
    tab.bitsLeft += 8;
  }
  tab.bitsLeft -= tab.bits;
  return (tab.curByte>>>(tab.bitsLeft)) & ((1<<tab.bits)-1);
}

UTIF.decode._decodeG4 = function(data, off, slen, tgt, toff, w) {}
UTIF.decode._decodeG3 = function(data, off, slen, tgt, toff, w) {}
UTIF.decode._decodeThunder = function(data, off, slen, tgt, toff) {}
UTIF.decode._decodeOldJPEG = function(img, data, off, len, tgt, toff) {}
UTIF.decode._decodeNewJPEG = function(img, data, off, len, tgt, toff) {}

UTIF._binBE = {
  nextZero: function(data, o) { while(data[o]!=0) o++; return o; },
  readUshort: function(buff, p) { return (buff[p]<< 8) |  buff[p+1]; },
  readShort:  function(buff, p) { var a=UTIF._binBE.readUshort(buff,p); return (a & 0x8000) ? a-(1<<16) : a; },
  readInt:    function(buff, p) { return (buff[p]<<24) | (buff[p+1]<<16) | (buff[p+2]<< 8) | buff[p+3]; },
  readUint:   function(buff, p) { return UTIF._binBE.readInt(buff,p)>>>0; },
  readASCII:  function(buff, p, l) { var s = ""; for(var i=0; i<l; i++) s += String.fromCharCode(buff[p+i]); return s; },
  readIFD:    function(bin, data, offset, ifds, depth, p) {
    var cnt = p.readUshort(data, offset);  offset+=2;
    var ifd = {};
    for(var i=0; i<cnt; i++) {
      var tag = p.readUshort(data, offset);   offset+=2;
      var typ = p.readUshort(data, offset);   offset+=2;
      var num = p.readUint  (data, offset);   offset+=4;
      var vof = p.readUint  (data, offset);   offset+=4;
      
      var arr = [], cont = [null,1,1,2,4,8,1,1,2,4,8,4,8][typ];
      if(cont*num<=4) vof = offset-4;
      
      if(typ==1||typ==7) for(var j=0; j<num; j++) arr.push(data[vof+j]);
      if(typ==2) arr.push(p.readASCII(data,vof,num-1));
      if(typ==3) for(var j=0; j<num; j++) arr.push(p.readUshort(data, vof+2*j));
      if(typ==4) for(var j=0; j<num; j++) arr.push(p.readUint  (data, vof+4*j));
      if(typ==5||typ==10) {
        var ri = typ==5 ? p.readUint : p.readInt;
        for(var j=0; j<num; j++) arr.push([ri(data, vof+j*8), ri(data, vof+j*8+4)]);
      }
      if(typ==8) for(var j=0; j<num; j++) arr.push(p.readShort(data, vof+2*j));
      if(typ==9) for(var j=0; j<num; j++) arr.push(p.readInt  (data, vof+4*j));
      if(typ==11) for(var j=0; j<num; j++) arr.push(UTIF._binBE.readFloat(data, vof+4*j));
      if(typ==12) for(var j=0; j<num; j++) arr.push(UTIF._binBE.readDouble(data, vof+8*j));
      ifd["t"+tag] = arr;
      
      if(tag==330 && ifd["t272"] && ifd["t272"][0]=="DSLR-A100") {}
      if(tag==330 || tag==34665) {
        var oarr = tag==330 ? ifd.t330 : ifd.t34665, subfd = [];
        for(var j=0; j<oarr.length; j++) p.readIFD(bin, data, oarr[j], subfd, depth+1, p);
        if(tag==330) ifd.subIFD = subfd;
        if(tag==34665) ifd.exifIFD = subfd[0];
      }
    }
    ifds.push(ifd);
    ifd.isLE = p==UTIF._binLE;
    
    if(cnt!=0) {
      var noff = p.readUint(data, offset);
      if(noff!=0 && noff<data.length-10 && depth<5) p.readIFD(bin, data, noff, ifds, depth+1, p);
    }
  },
  readFloat: function(data, o) {
    var u=UTIF._binBE.readUint(data,o), sgn=(u>>>31)?-1:1, exp=((u>>>23)&255)-127, man=(u&((1<<23)-1))/8388608;
    return sgn*(1+man)*Math.pow(2,exp);
  },
  readDouble: function(data, o) {
    var u1=UTIF._binBE.readUint(data,o), u2=UTIF._binBE.readUint(data,o+4);
    var sgn=(u1>>>31)?-1:1, exp=((u1>>>20)&0x7FF)-1023;
    var man = (((u1&((1<<20)-1)) * 4294967296) + u2)/4503599627370496;
    return sgn*(1+man)*Math.pow(2,exp);
  }
}

UTIF._binLE = {
  nextZero: UTIF._binBE.nextZero,
  readUshort: function(buff, p) { return  (buff[p+1]<< 8) | buff[p]; },
  readShort:  function(buff, p) { var a=UTIF._binLE.readUshort(buff,p); return (a & 0x8000) ? a-(1<<16) : a; },
  readInt:    function(buff, p) { return (buff[p+3]<<24) | (buff[p+2]<<16) | (buff[p+1]<< 8) | buff[p]; },
  readUint:   function(buff, p) { return UTIF._binLE.readInt(buff,p)>>>0; },
  readASCII:  UTIF._binBE.readASCII,
  readIFD:    UTIF._binBE.readIFD,
  readFloat:  function(data, o) {
    var u=UTIF._binLE.readUint(data,o), sgn=(u>>>31)?-1:1, exp=((u>>>23)&255)-127, man=(u&((1<<23)-1))/8388608;
    return sgn*(1+man)*Math.pow(2,exp);
  },
  readDouble: function(data, o) {
    var u2=UTIF._binLE.readUint(data,o), u1=UTIF._binLE.readUint(data,o+4);
    var sgn=(u1>>>31)?-1:1, exp=((u1>>>20)&0x7FF)-1023;
    var man = (((u1&((1<<20)-1)) * 4294967296) + u2)/4503599627370496;
    return sgn*(1+man)*Math.pow(2,exp);
  }
}

})(typeof module !== 'undefined' && module.exports ? (module.exports = {}) : (window.UTIF = {}));
