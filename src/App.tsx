import { useState, useEffect, useRef } from 'react'
import { 
  Container, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Button, 
  Grid, 
  AppBar, 
  Toolbar, 
  Paper, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  LinearProgress,
  useTheme,
  alpha
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import RefreshIcon from '@mui/icons-material/Refresh'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import StopIcon from '@mui/icons-material/Stop'
import TerminalIcon from '@mui/icons-material/Terminal'
import axios from 'axios'
import { createTheme, ThemeProvider } from '@mui/material/styles'

interface DockerContainer {
  id: string
  name: string
  status: string
  image: string
  remainingTime: number | null
}

function App() {
  const theme = useTheme()
  const azureTheme = createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: '#0078d4',
      },
      secondary: {
        main: '#a0aeb4',
      },
      background: {
        default: '#1b1b1f',
        paper: '#2b2b3b',
      },
      text: {
        primary: '#ffffff',
        secondary: '#a0aeb4',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 2,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 8,
          },
        },
      },
    },
  })

  const [containers, setContainers] = useState<DockerContainer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedContainer, setSelectedContainer] = useState<DockerContainer | null>(null)
  const [logs, setLogs] = useState<string>('')
  const [loadingLogs, setLoadingLogs] = useState(false)
  const logsRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef<number>(0)
  const wasAtBottomRef = useRef<boolean>(true)

  const isAtBottom = () => {
    if (!logsRef.current) return true
    const { scrollTop, scrollHeight, clientHeight } = logsRef.current
    return Math.abs(scrollHeight - scrollTop - clientHeight) < 10
  }

  const fetchContainers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/containers')
      setContainers(response.data)
    } catch (error) {
      console.error('Error fetching containers:', error)
    } finally {
      setLoading(false)
    }
  }

  const startContainer = async (containerId: string) => {
    try {
      await axios.post(`http://localhost:3001/api/containers/${containerId}/start`)
      fetchContainers()
    } catch (error) {
      console.error('Error starting container:', error)
    }
  }

  const stopContainer = async (containerId: string) => {
    try {
      await axios.post(`http://localhost:3001/api/containers/${containerId}/stop`)
      fetchContainers()
    } catch (error) {
      console.error('Error stopping container:', error)
    }
  }

  const fetchLogs = async (containerId: string) => {
    if (!containerId) return

    try {
      setLoadingLogs(true)
      wasAtBottomRef.current = isAtBottom()
      if (logsRef.current) {
        scrollPositionRef.current = logsRef.current.scrollTop
      }

      const response = await axios.get(`http://localhost:3001/api/containers/${containerId}/logs`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.data && typeof response.data.logs === 'string') {
        setLogs(response.data.logs)
      } else {
        console.error('Formato de logs inesperado:', response.data)
        setLogs('Error: Formato de logs inesperado')
      }

    } catch (error) {
      console.error('Error al obtener los logs:', error)
      setLogs('Error al obtener los logs del contenedor')
    } finally {
      setLoadingLogs(false)
      // Aseguramos que el scroll se actualice después de que los logs se hayan renderizado
      setTimeout(() => {
        if (logsRef.current) {
          if (wasAtBottomRef.current) {
            logsRef.current.scrollTop = logsRef.current.scrollHeight
          } else {
            logsRef.current.scrollTop = scrollPositionRef.current
          }
        }
      }, 100)
    }
  }

  const handleOpenLogs = async (container: DockerContainer) => {
    if (!container || !container.id) return
    setSelectedContainer(container)
    await fetchLogs(container.id)
  }

  const handleCloseLogs = () => {
    setSelectedContainer(null)
    setLogs('')
  }

  useEffect(() => {
    fetchContainers()
    const interval = setInterval(fetchContainers, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number | null) => {
    if (seconds === null) return ''
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const isContainerRunning = (status: string) => {
    return status.toLowerCase().includes('up')
  }

  const getProgressValue = (remainingTime: number | null) => {
    if (remainingTime === null) return 0
    return ((5 * 60 - remainingTime) / (5 * 60)) * 100
  }

  return (
    <ThemeProvider theme={azureTheme}>
      <Box sx={{ 
        width: '100%',
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <AppBar 
          position="static" 
          elevation={0}
          sx={{ 
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Toolbar sx={{ minHeight: 48 }}>
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontSize: '1.125rem',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'text.primary'
              }}
            >
              🐳 Docker Containers
            </Typography>
            <Button 
              onClick={fetchContainers} 
              disabled={loading}
              startIcon={<RefreshIcon />}
              variant="text"
              sx={{ 
                color: 'text.secondary',
                '&:hover': {
                  color: 'text.primary',
                  bgcolor: 'rgba(255, 255, 255, 0.08)'
                }
              }}
            >
              Refresh
            </Button>
          </Toolbar>
        </AppBar>

        <Container 
          maxWidth={false} 
          sx={{ 
            flex: 1,
            py: 4,
            px: { xs: 2, sm: 3, md: 4 }
          }}
        >
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3,
              mb: 4,
              bgcolor: 'background.paper',
              borderRadius: 2,
              border: 1,
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontWeight: 500,
                color: 'text.primary',
                mb: 3
              }}
            >
              Overview
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              gap: 2,
              flexWrap: 'wrap'
            }}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  minWidth: 200,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  border: 1,
                  borderColor: 'primary.main',
                  borderRadius: 1
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Total Containers
                </Typography>
                <Typography variant="h4" sx={{ color: 'text.primary', mt: 1 }}>
                  {containers.length}
                </Typography>
              </Paper>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  minWidth: 200,
                  bgcolor: alpha(theme.palette.success.main, 0.1),
                  border: 1,
                  borderColor: 'success.main',
                  borderRadius: 1
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Running
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main', mt: 1 }}>
                  {containers.filter(c => isContainerRunning(c.status)).length}
                </Typography>
              </Paper>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 2,
                  minWidth: 200,
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  border: 1,
                  borderColor: 'error.main',
                  borderRadius: 1
                }}
              >
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  Stopped
                </Typography>
                <Typography variant="h4" sx={{ color: 'error.main', mt: 1 }}>
                  {containers.filter(c => !isContainerRunning(c.status)).length}
                </Typography>
              </Paper>
            </Box>
          </Paper>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <Typography sx={{ color: 'text.secondary' }}>Loading containers...</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {containers.map((container) => {
                const isRunning = isContainerRunning(container.status)
                const progressValue = getProgressValue(container.remainingTime)
                
                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={container.id}>
                    <Card 
                      sx={{ 
                        height: '100%',
                        bgcolor: 'background.paper',
                        border: 1,
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: `0 0 0 1px ${theme.palette.primary.main}`
                        }
                      }}
                    >
                      {isRunning && container.remainingTime !== null && (
                        <LinearProgress 
                          variant="determinate" 
                          value={progressValue}
                          sx={{
                            height: 2,
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: 'primary.main'
                            }
                          }}
                        />
                      )}
                      <CardContent>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 500,
                            mb: 2,
                            color: 'text.primary'
                          }}
                        >
                          {container.name}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Chip 
                            label={container.status}
                            size="small"
                            sx={{ 
                              bgcolor: isRunning ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                              color: isRunning ? 'success.main' : 'error.main',
                              borderRadius: 1
                            }}
                          />
                          {isRunning && container.remainingTime !== null && (
                            <Chip 
                              label={`⏱️ ${formatTime(container.remainingTime)}`}
                              size="small"
                              sx={{ 
                                ml: 1,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                borderRadius: 1
                              }}
                            />
                          )}
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 3,
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            p: 1,
                            borderRadius: 1
                          }}
                        >
                          {container.image}
                        </Typography>
                        <Box sx={{ 
                          display: 'flex', 
                          gap: 1,
                          '& .MuiButton-root': {
                            minWidth: 0,
                            flex: 1
                          }
                        }}>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => startContainer(container.id)}
                            disabled={isRunning}
                            startIcon={<PlayArrowIcon />}
                            size="small"
                          >
                            Start
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => stopContainer(container.id)}
                            disabled={!isRunning}
                            startIcon={<StopIcon />}
                            size="small"
                          >
                            Stop
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={() => handleOpenLogs(container)}
                            startIcon={<TerminalIcon />}
                            size="small"
                          >
                            Logs
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Container>

        <Dialog
          open={!!selectedContainer}
          onClose={handleCloseLogs}
          maxWidth="xl"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: 'background.paper',
              backgroundImage: 'none'
            }
          }}
        >
          <DialogTitle sx={{ 
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TerminalIcon sx={{ color: 'primary.main' }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {selectedContainer?.name} - Logs
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => selectedContainer && fetchLogs(selectedContainer.id)}
                disabled={loadingLogs}
                size="small"
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
              <IconButton
                onClick={handleCloseLogs}
                size="small"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Box
              ref={logsRef}
              component="pre"
              sx={{
                fontFamily: 'Consolas, monospace',
                fontSize: '12px',
                lineHeight: 1.5,
                p: 2,
                height: '60vh',
                overflow: 'auto',
                bgcolor: 'background.default',
                color: 'text.primary',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}
            >
              {loadingLogs ? 'Cargando logs...' : logs}
            </Box>
          </DialogContent>
        </Dialog>
      </Box>
    </ThemeProvider>
  )
}

export default App
