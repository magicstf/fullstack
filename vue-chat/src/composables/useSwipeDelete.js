import { ref, onUnmounted } from 'vue'
import { SWIPE_DELETE_WIDTH } from '../constants/chat.js'

export function useSwipeDelete({ disabled, onSelect, onDelete }) {
  const swipedSessionId = ref(null)
  const swipeOffset = ref(0)
  const isSwipeDragging = ref(false)

  let swipeStartX = 0
  let swipeStartOffset = 0
  let swipingSessionId = null
  let swipeMoved = false
  let mouseDragSessionId = null

  function resetSwipe() {
    swipedSessionId.value = null
    swipeOffset.value = 0
    isSwipeDragging.value = false
    swipingSessionId = null
    swipeMoved = false
  }

  function isSessionSwipedOpen(sessionId) {
    return swipedSessionId.value === sessionId && swipeOffset.value < 0
  }

  function getSwipeStyle(sessionId) {
    const offset =
      swipedSessionId.value === sessionId || swipingSessionId === sessionId
        ? swipeOffset.value
        : 0
    return {
      transform: `translateX(${offset}px)`,
      transition: isSwipeDragging.value ? 'none' : 'transform 0.2s ease'
    }
  }

  function getSwipeClientX(e) {
    return e.touches?.[0]?.clientX ?? e.clientX
  }

  function onSwipeStart(e, sessionId) {
    if (disabled?.value ?? disabled) return
    if (e.type === 'mousedown' && e.button !== 0) return

    if (swipedSessionId.value && swipedSessionId.value !== sessionId) {
      resetSwipe()
    }

    swipeStartX = getSwipeClientX(e)
    swipingSessionId = sessionId
    swipeMoved = false
    isSwipeDragging.value = true
    swipeStartOffset =
      swipedSessionId.value === sessionId ? swipeOffset.value : 0
    swipedSessionId.value = sessionId

    if (e.type === 'mousedown') {
      mouseDragSessionId = sessionId
      document.addEventListener('mousemove', onDocumentSwipeMove)
      document.addEventListener('mouseup', onDocumentSwipeEnd)
    }
  }

  function onSwipeMove(e, sessionId) {
    if (swipingSessionId !== sessionId) return

    const delta = getSwipeClientX(e) - swipeStartX
    if (Math.abs(delta) > 8) {
      swipeMoved = true
      if (e.cancelable) e.preventDefault()
    }

    swipeOffset.value = Math.min(0, Math.max(-SWIPE_DELETE_WIDTH, swipeStartOffset + delta))
  }

  function onSwipeEnd(sessionId) {
    if (swipingSessionId !== sessionId) return

    isSwipeDragging.value = false
    swipingSessionId = null

    if (swipeOffset.value < -SWIPE_DELETE_WIDTH / 2) {
      swipeOffset.value = -SWIPE_DELETE_WIDTH
      swipedSessionId.value = sessionId
    } else {
      resetSwipe()
    }
  }

  function onDocumentSwipeMove(e) {
    if (mouseDragSessionId) onSwipeMove(e, mouseDragSessionId)
  }

  function onDocumentSwipeEnd() {
    if (!mouseDragSessionId) return
    const sessionId = mouseDragSessionId
    mouseDragSessionId = null
    document.removeEventListener('mousemove', onDocumentSwipeMove)
    document.removeEventListener('mouseup', onDocumentSwipeEnd)
    onSwipeEnd(sessionId)
  }

  function handleSessionClick(sessionId) {
    if (swipeMoved) {
      swipeMoved = false
      return
    }
    if (swipedSessionId.value === sessionId && swipeOffset.value < 0) {
      resetSwipe()
      return
    }
    onSelect?.(sessionId)
  }

  async function handleDelete(sessionId) {
    await onDelete?.(sessionId)
    resetSwipe()
  }

  onUnmounted(() => {
    document.removeEventListener('mousemove', onDocumentSwipeMove)
    document.removeEventListener('mouseup', onDocumentSwipeEnd)
  })

  return {
    isSessionSwipedOpen,
    getSwipeStyle,
    onSwipeStart,
    onSwipeMove,
    onSwipeEnd,
    handleSessionClick,
    handleDelete,
    resetSwipe
  }
}
