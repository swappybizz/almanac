  // severity → hex‐color map
  import { upload } from '@vercel/blob/client'

/**
 * Fetch all media for a given user.
 */
export async function fetchMedia(username, setMedia, setLoading) {
  if (!username) return
  try {
    const res = await fetch(
      `/api/media?username=${encodeURIComponent(username)}`
    )
    const { media } = await res.json()
    setMedia(media)
  } catch (error) {
    console.error('Error fetching media:', error)
  } finally {
    setLoading(false)
  }
}

/**
 * Send a single audio item to transcription, then re-fetch.
 */
export async function transcribeAudio(audio, refetch) {
  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: audio._id, url: audio.url }),
    })
    if (!res.ok) {
      console.error('Transcription failed for audio:', audio._id)
    } else {
      refetch()
    }
  } catch (error) {
    console.error('Error transcribing audio:', error)
  }
}

/**
 * Handle <input type="file" /> changes: upload each file, POST its metadata,
 * and then re-fetch the gallery.
 */
export async function handleFileChange(e, username, setUploading, refetch) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  setUploading(true)

  try {
    for (const file of files) {
      let ext = file.type.split('/')[1]
      if (ext === 'jpeg') ext = 'jpg'
      const fileName = `photo-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)}.${ext}`

      const result = await upload(fileName, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      console.log('Uploaded photo result:', result)

      if (result.url) {
        await fetch('/api/metadata', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'image',
            timestamp: Date.now(),
            url: result.url,
            username,
          }),
        })
      }
    }
    refetch()
  } catch (error) {
    console.error('Error uploading photo:', error)
  } finally {
    setUploading(false)
    e.target.value = ''
  }
}

/**
 * Generic delete-by-IDs helper.  Shows confirm(), calls DELETE, re-fetches on success.
 * onSuccessText is optional (e.g. “Deleted 1 item.”).
 */
export async function deleteMedia(
  ids,
  endpoint,
  refetch,
  confirmMessage,
  onSuccessText = ''
) {
  if (!window.confirm(confirmMessage)) return

  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    })
    if (!res.ok) throw new Error('Failed to delete items')
    if (onSuccessText) alert(onSuccessText)
    refetch()
  } catch (error) {
    console.error('Deletion failed:', error)
    alert('Deletion failed')
  }
}

/**
 * Kick off report generation for the selected items, then show the popup on completion.
 */
export async function generateReportAPI(
  items,
  score,
  language,
  setReportData,
  setReportGenStatus,
  setShowPopup
) {
  setReportGenStatus('InProcess')
  try {
    const res = await fetch('/api/genReport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, score, language }),
    })
    if (!res.ok) throw new Error('Failed to generate report')
    const data = await res.json()
    setReportData(data)
    setReportGenStatus('Completed')
    setShowPopup(true)
  } catch (error) {
    console.error('Report generation failed:', error)
    setReportGenStatus('Failed')
    alert('Report generation failed')
  }
}

  export const severityColorMap = {
    red:   'FF0000',
    yellow:'FFFF00',
    green: '00FF00'
  }

  export async function fetchScoreType() {
      try {
        const res = await fetch('/api/getSettings')
        if (!res.ok) {
          throw new Error(`Failed to fetch settings: ${res.status} ${res.statusText}`)
        }
        const { scoreType } = await res.json()
        return scoreType ?? 'color'
      } catch (err) {
        console.error('Error fetching scoreType:', err)
        return 'color'
      }
    }