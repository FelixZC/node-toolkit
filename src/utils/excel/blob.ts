;(function (view) {
  'use strict'

  view.URL = view.URL || view.webkitURL

  if (view.Blob && view.URL) {
    try {
      new Blob()
      return
    } catch (e) {
      console.log(e)
    }
  } // Internally we use a BlobBuilder implementation to base Blob off of
  // in order to support older browsers that only have BlobBuilder

  const BlobBuilder =
    view.BlobBuilder ||
    view.WebKitBlobBuilder ||
    view.MozBlobBuilder ||
    (function (view) {
      const get_class = function (object) {
        return Object.prototype.toString
          .call(object)
          .match(/^\[object\s(.*)\]$/)[1]
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
      const FileReaderSync = view.FileReaderSync

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
      const btoa = view.btoa
      const atob = view.atob
      const ArrayBuffer = view.ArrayBuffer
      const Uint8Array = view.Uint8Array
      FakeBlob.fake = FB_proto.fake = true

      while (file_ex_code--) {
        FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1
      }

      if (!real_URL.createObjectURL) {
        URL = view.URL = {}
      }

      URL.createObjectURL = function (blob) {
        let type = blob.type
        let data_URI_header

        if (type === null) {
          type = 'application/octet-stream'
        }

        if (blob instanceof FakeBlob) {
          data_URI_header = 'data:' + type

          if (blob.encoding === 'base64') {
            return data_URI_header + ';base64,' + blob.data
          } else if (blob.encoding === 'URI') {
            return data_URI_header + ',' + decodeURIComponent(blob.data)
          }

          if (btoa) {
            return data_URI_header + ';base64,' + btoa(blob.data)
          }

          return data_URI_header + ',' + encodeURIComponent(blob.data)
        } else if (real_create_object_URL) {
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
        /*, endings*/
      ) {
        const bb = this.data // decode data to a binary string

        if (
          Uint8Array &&
          (data instanceof ArrayBuffer || data instanceof Uint8Array)
        ) {
          let str = ''
          const buf = new Uint8Array(data)
          let i = 0
          const buf_len = buf.length

          for (; i < buf_len; i++) {
            str += String.fromCharCode(buf[i])
          }

          bb.push(str)
        } else if (get_class(data) === 'Blob' || get_class(data) === 'File') {
          if (FileReaderSync) {
            const fr = new FileReaderSync()
            bb.push(fr.readAsBinaryString(data))
          } else {
            // async FileReader won't work as BlobBuilder is sync
            throw new FileException('NOT_READABLE_ERR')
          }
        } else if (data instanceof FakeBlob) {
          if (data.encoding === 'base64' && atob) {
            bb.push(atob(data.data))
          } else if (data.encoding === 'URI') {
            bb.push(decodeURIComponent(data.data))
          } else if (data.encoding === 'raw') {
            bb.push(data.data)
          }
        } else {
          if (typeof data !== 'string') {
            data = String(data) // convert unsupported types to strings
          } // decode UTF-16 to binary string

          bb.push(unescape(encodeURIComponent(data)))
        }
      }

      FBB_proto.getBlob = function (type) {
        if (!arguments.length) {
          type = null
        }

        return new FakeBlob(this.data.join(''), type, 'raw')
      }

      FBB_proto.toString = function () {
        return '[object BlobBuilder]'
      }

      FB_proto.slice = function (start, end, type) {
        const args = arguments.length

        if (args < 3) {
          type = null
        }

        return new FakeBlob(
          this.data.slice(start, args > 1 ? end : this.data.length),
          type,
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
