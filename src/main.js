import './style.css'
import { supabase } from './supabase.js'

const $ = (id) => document.getElementById(id)

const authView = $('auth-view')
const composeView = $('compose-view')
const userArea = $('user-area')
const authForm = $('auth-form')
const authSubmit = $('auth-submit')
const authMessage = $('auth-message')
const usernameField = $('username-field')
const postForm = $('post-form')
const postContent = $('post-content')
const postSubmit = $('post-submit')
const postMessage = $('post-message')
const charCount = $('char-count')
const timeline = $('timeline')

const MAX_LEN = 280
let mode = 'login' // 'login' | 'signup'
let currentUser = null

// ---------- ログイン・新規登録 ----------

function setMode(next) {
  mode = next
  $('tab-login').classList.toggle('active', mode === 'login')
  $('tab-signup').classList.toggle('active', mode === 'signup')
  usernameField.hidden = mode !== 'signup'
  $('username').required = mode === 'signup'
  $('password').autocomplete = mode === 'signup' ? 'new-password' : 'current-password'
  authSubmit.textContent = mode === 'signup' ? '登録する' : 'ログイン'
  authMessage.textContent = ''
}

$('tab-login').addEventListener('click', () => setMode('login'))
$('tab-signup').addEventListener('click', () => setMode('signup'))

authForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const email = $('email').value.trim()
  const password = $('password').value
  authSubmit.disabled = true
  authMessage.textContent = ''

  if (mode === 'signup') {
    const username = $('username').value.trim()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    })
    if (error) {
      authMessage.textContent = `登録できませんでした：${error.message}`
    } else if (!data.session) {
      authMessage.textContent = '確認メールを送りました。メール内のリンクを開いてからログインしてください。'
    }
  } else {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) authMessage.textContent = `ログインできませんでした：${error.message}`
  }
  authSubmit.disabled = false
})

$('logout-btn').addEventListener('click', () => supabase.auth.signOut())

async function render(session) {
  currentUser = session?.user ?? null
  authView.hidden = !!currentUser
  composeView.hidden = !currentUser
  userArea.hidden = !currentUser

  if (currentUser) {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', currentUser.id)
      .maybeSingle()
    $('user-name').textContent = `@${data?.username ?? currentUser.email}`
  }
  loadTimeline()
}

supabase.auth.onAuthStateChange((_event, session) => {
  // コールバック内で await すると supabase-js が詰まるため、次のタイミングで描画する
  setTimeout(() => render(session), 0)
})

// ---------- 投稿 ----------

function updateCount() {
  const len = postContent.value.length
  charCount.textContent = `${len} / ${MAX_LEN}`
  postSubmit.disabled = postContent.value.trim().length === 0 || len > MAX_LEN
}
postContent.addEventListener('input', updateCount)

postForm.addEventListener('submit', async (e) => {
  e.preventDefault()
  const content = postContent.value.trim()
  if (!content) return
  postSubmit.disabled = true
  postMessage.textContent = ''

  const { error } = await supabase.from('posts').insert({ content })
  if (error) {
    postMessage.textContent = `投稿できませんでした：${error.message}`
    postSubmit.disabled = false
    return
  }
  postContent.value = ''
  updateCount()
  loadTimeline()
})

// ---------- タイムライン ----------

function formatTime(iso) {
  return new Date(iso).toLocaleString('ja-JP', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function loadTimeline() {
  const { data, error } = await supabase
    .from('posts')
    .select('id, content, created_at, user_id, profiles(username)')
    .order('created_at', { ascending: false })
    .limit(100)

  timeline.replaceChildren()
  if (error) {
    timeline.append(emptyItem(`読み込めませんでした：${error.message}`))
    return
  }
  if (data.length === 0) {
    timeline.append(emptyItem('まだつぶやきはありません'))
    return
  }
  for (const post of data) timeline.append(postItem(post))
}

function emptyItem(text) {
  const li = document.createElement('li')
  li.className = 'empty'
  li.textContent = text
  return li
}

function postItem(post) {
  const li = document.createElement('li')
  li.className = 'post'

  const head = document.createElement('div')
  head.className = 'post-head'
  const name = document.createElement('span')
  name.className = 'post-user'
  name.textContent = `@${post.profiles?.username ?? 'unknown'}`
  const time = document.createElement('time')
  time.className = 'post-time'
  time.dateTime = post.created_at
  time.textContent = formatTime(post.created_at)
  head.append(name, time)

  // textContent で入れるので、投稿内の HTML はそのまま文字として表示される
  const body = document.createElement('p')
  body.className = 'post-body'
  body.textContent = post.content

  li.append(head, body)

  if (currentUser && post.user_id === currentUser.id) {
    const del = document.createElement('button')
    del.type = 'button'
    del.className = 'post-delete'
    del.textContent = '削除'
    del.addEventListener('click', async () => {
      if (!confirm('このつぶやきを削除しますか？')) return
      const { error } = await supabase.from('posts').delete().eq('id', post.id)
      if (error) alert(`削除できませんでした：${error.message}`)
      loadTimeline()
    })
    li.append(del)
  }
  return li
}

setMode('login')
