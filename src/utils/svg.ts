/**
 * Base64 工具类 (参考自用户提供的实现)
 */
export class Base64 {
  private static readonly _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  static encode(input: string): string {
    let output = ''
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4
    let i = 0
    input = this._utf8_encode(input)

    while (i < input.length) {
      chr1 = input.charCodeAt(i++)
      chr2 = input.charCodeAt(i++)
      chr3 = input.charCodeAt(i++)

      enc1 = chr1 >> 2
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      enc4 = chr3 & 63

      if (isNaN(chr2)) {
        enc3 = enc4 = 64
      } else if (isNaN(chr3)) {
        enc4 = 64
      }

      output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4)
    }

    return output
  }

  private static _utf8_encode(string: string): string {
    string = string.replace(/\r\n/g, '\n')
    let utftext = ''
    for (let n = 0; n < string.length; n++) {
      let c = string.charCodeAt(n)
      if (c < 128) {
        utftext += String.fromCharCode(c)
      } else if ((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192)
        utftext += String.fromCharCode((c & 63) | 128)
      } else {
        utftext += String.fromCharCode((c >> 12) | 224)
        utftext += String.fromCharCode(((c >> 6) & 63) | 128)
        utftext += String.fromCharCode((c & 63) | 128)
      }
    }
    return utftext
  }
}

/**
 * 将 SVG 字符串转换为 Base64 Data URL
 */
export function svgToBase64(svgContent: string): string {
  if (!svgContent) return ''
  const svg = svgContent.trim()
    .replace(/<svg/, (~svgContent.indexOf('xmlns') ? '<svg' : '<svg xmlns="http://www.w3.org/2000/svg"'))
  return `data:image/svg+xml;base64,${Base64.encode(svg)}`
}

/**
 * 修改 SVG 颜色并优化缩放及比例
 */
export function changeSvgColor(sourceFile: string, color: string): string {
  let newSvg = sourceFile.trim()

  // 1. 确保有 xmlns
  if (!newSvg.includes('xmlns')) {
    newSvg = newSvg.replace(/<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
  }

  // 2. 注入颜色
  if (/fill=".*?"/.test(newSvg)) {
    newSvg = newSvg
      .replace(/fill="[^none].*?"/g, `fill="${color}"`)
      .replace(/stroke="[^none].*?"/g, `stroke="${color}"`)
  } else {
    newSvg = newSvg.replace(/<svg/, `<svg fill="${color}"`)
  }

  // 3. 强制 1:1 比例支持与保持纵横比缩放 (meet 表示保持纵横比缩放直到长边完全显示)
  // 移除固定的 width/height，改为 100% 以适配容器，并添加 preserveAspectRatio
  newSvg = newSvg
    .replace(/width=".*?"/, 'width="100%"')
    .replace(/height=".*?"/, 'height="100%"')

  if (!newSvg.includes('preserveAspectRatio')) {
    newSvg = newSvg.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')
  } else {
    newSvg = newSvg.replace(/preserveAspectRatio=".*?"/, 'preserveAspectRatio="xMidYMid meet"')
  }

  return newSvg
}
