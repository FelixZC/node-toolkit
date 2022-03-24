;(function (view) {
  view.URL = view.URL || view.webkitURL

  if (view.Blob && view.URL) {
    try {
      new Blob()
      return
    } catch (e) {
      console.warn(e)
    }
  } // Internally we use a BlobBuilder implementation to base Blob off of
  // in order to support older browsers that only have BlobBuilder

  const BlobBuilder =
    view.BlobBuilder ||
    view.WebKitBlobBuilder ||
    view.MozBlobBuilder ||
    (function (view) {
      const get_class = function (object) {
        return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1]
      }

      const FakeBlobBuilder = function BlobBuilder() {
        this.data = []
      }

      const FakeBlob = function Blob(data, type, encoding) {
        this.data = data
        this.size = data.length
        this.type = type
        this.encoding = encoding
      }

      const FBB_proto = FakeBlobBuilder.prototype
      const FB_proto = FakeBlob.prototype
      const { FileReaderSync } = view

      const FileException = function (type) {
        this.code = this[(this.name = type)]
      }

      const file_ex_codes = (
        'NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR ' +
        'NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR'
      ).split(' ')
      let file_ex_code = file_ex_codes.length
      const real_URL = view.URL || view.webkitURL || view
      const real_create_object_URL = real_URL.createObjectURL
      const real_revoke_object_URL = real_URL.revokeObjectURL
      let URL = real_URL
      const { btoa } = view
      const { atob } = view
      const { ArrayBuffer } = view
      const { Uint8Array } = view
      FakeBlob.fake = FB_proto.fake = true

      while (file_ex_code--) {
        FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1
      }

      if (!real_URL.createObjectURL) {
        URL = view.URL = {}
      }

      URL.createObjectURL = function (blob) {
        let { type } = blob
        let data_URI_header

        if (type === null) {
          type = 'application/octet-stream'
        }

        if (blob instanceof FakeBlob) {
          data_URI_header = `data:${type}`

          if (blob.encoding === 'base64') {
            return `${data_URI_header};base64,${blob.data}`
          }

          if (blob.encoding === 'URI') {
            return `${data_URI_header},${decodeURIComponent(blob.data)}`
          }

          if (btoa) {
            return `${data_URI_header};base64,${btoa(blob.data)}`
          }

          return `${data_URI_header},${encodeURIComponent(blob.data)}`
        }

        if (real_create_object_URL) {
          return real_create_object_URL.call(real_URL, blob)
        }
      }

      URL.revokeObjectURL = function (object_URL) {
        if (object_URL.substring(0, 5) !== 'data:' && real_revoke_object_URL) {
          real_revoke_object_URL.call(real_URL, object_URL)
        }
      }

      FBB_proto.append = function (
        data
        /* , endings */
      ) {
        let localData = data
        const bb = this.data // decode data to a binary string

        if (Uint8Array && (localData instanceof ArrayBuffer || localData instanceof Uint8Array)) {
          let str = ''
          const buf = new Uint8Array(localData)
          let i = 0
          const buf_len = buf.length

          for (; i < buf_len; i++) {
            str += String.fromCharCode(buf[i])
          }

          bb.push(str)
        } else if (get_class(localData) === 'Blob' || get_class(localData) === 'File') {
          if (FileReaderSync) {
            const fr = new FileReaderSync()
            bb.push(fr.readAsBinaryString(localData))
          } else {
            // async FileReader won't work as BlobBuilder is sync
            throw new FileException('NOT_READABLE_ERR')
          }
        } else if (localData instanceof FakeBlob) {
          if (localData.encoding === 'base64' && atob) {
            bb.push(atob(localData.data))
          } else if (localData.encoding === 'URI') {
            bb.push(decodeURIComponent(localData.data))
          } else if (localData.encoding === 'raw') {
            bb.push(localData.data)
          }
        } else {
          if (typeof localData !== 'string') {
            localData = String(localData) // convert unsupported types to strings
          } // decode UTF-16 to binary string

          bb.push(unescape(encodeURIComponent(localData)))
        }
      }

      FBB_proto.getBlob = function (type) {
        let localType = type

        if (!arguments.length) {
          localType = null
        }

        return new FakeBlob(this.data.join(''), localType, 'raw')
      }

      FBB_proto.toString = function () {
        return '[object BlobBuilder]'
      }

      FB_proto.slice = function (start, end, type) {
        let localType = type
        const args = arguments.length

        if (args < 3) {
          localType = null
        }

        return new FakeBlob(
          this.data.slice(start, args > 1 ? end : this.data.length),
          localType,
          this.encoding
        )
      }

      FB_proto.toString = function () {
        return '[object Blob]'
      }

      FB_proto.close = function () {
        this.size = this.data.length = 0
      }

      return FakeBlobBuilder
    })(view)

  view.Blob = function Blob(blobParts, options) {
    const type = options ? options.type || '' : ''
    const builder = new BlobBuilder()

    if (blobParts) {
      for (let i = 0, len = blobParts.length; i < len; i++) {
        builder.append(blobParts[i])
      }
    }

    return builder.getBlob(type)
  }
})(
  (typeof self !== 'undefined' && self) ||
    (typeof window !== 'undefined' && window) ||
    this.content ||
    this
)
