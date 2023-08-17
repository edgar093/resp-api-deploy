const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.disable('x-powered-by')

app.use(express.json())

const ACCEPTED_ORIGINS = [
  'http://localhost:8080',
  'http://localhost:1234',
  'http://movies.com'
]

app.get('/movies', (req, res) => {
  // cuando la petición es del mismo origin el navegador no envia la cabecera
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin) // poner * para aceptarlos todos
  }

  const { genre } = req.query
  if (genre) {
    const moviesFilter = movies.filter(
      movie => movie.genre.some(genreMovie => genreMovie.toLowerCase() === genre.toLowerCase())
    )

    return res.json(moviesFilter)
  }

  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // se basa en path-to-regex
  const { id } = req.params
  const moviesFilter = movies.find(movie => movie.id === id)

  if (moviesFilter) return res.json(moviesFilter)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Escuchando en el puerto http://localhost:${PORT}`)
})
