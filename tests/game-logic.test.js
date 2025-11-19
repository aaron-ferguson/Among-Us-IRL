import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateRoomCode,
  getGameURL,
  checkWinConditions,
  checkCrewmateVictory,
  endGame
} from '../js/game-logic.js'
import { gameState } from '../js/game-state.js'

// Mock endGame to prevent DOM access
vi.mock('../js/game-logic.js', async () => {
  const actual = await vi.importActual('../js/game-logic.js')
  return {
    ...actual,
    endGame: vi.fn()
  }
})

describe('Room Code Generation', () => {
  it('should generate a 4-character alphanumeric code', () => {
    const code = generateRoomCode()

    expect(code).toBeDefined()
    expect(code).toHaveLength(4)
    // Code contains letters (excluding I, O) and numbers (excluding 0, 1)
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}$/)
  })

  it('should generate unique codes', () => {
    const codes = new Set()
    for (let i = 0; i < 100; i++) {
      codes.add(generateRoomCode())
    }

    // With 32^4 = 1,048,576 possible codes, 100 codes should be unique
    expect(codes.size).toBe(100)
  })
})

describe('Game URL Generation', () => {
  beforeEach(() => {
    // Mock window.location for URL generation
    global.window = {
      location: {
        origin: 'http://localhost:3000',
        pathname: '/'
      }
    }
  })

  it('should generate URL with room code from gameState', () => {
    gameState.roomCode = 'TEST'
    const url = getGameURL()

    expect(url).toContain('TEST')
    expect(url).toMatch(/\?room=TEST$/)
  })
})

describe('Win Condition Checks', () => {
  beforeEach(() => {
    // Reset gameState before each test
    gameState.players = []
    gameState.gameEnded = false
    gameState.winner = null
  })

  describe('checkWinConditions', () => {
    it('should return crewmates win when all imposters are eliminated', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: true },
        { name: 'Player2', role: 'crewmate', alive: true },
        { name: 'Imposter1', role: 'imposter', alive: false }
      ]

      const result = checkWinConditions()

      expect(result).toBeDefined()
      expect(result.winner).toBe('crewmates')
      expect(result.reason).toBe('All imposters eliminated')
    })

    it('should return imposters win when they equal crewmates', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: true },
        { name: 'Player2', role: 'crewmate', alive: false },
        { name: 'Imposter1', role: 'imposter', alive: true }
      ]

      const result = checkWinConditions()

      expect(result).toBeDefined()
      expect(result.winner).toBe('imposters')
      expect(result.reason).toBe('Imposters equal or outnumber crewmates')
    })

    it('should return imposters win when they outnumber crewmates', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: false },
        { name: 'Player2', role: 'crewmate', alive: false },
        { name: 'Player3', role: 'crewmate', alive: true },
        { name: 'Imposter1', role: 'imposter', alive: true },
        { name: 'Imposter2', role: 'imposter', alive: true }
      ]

      const result = checkWinConditions()

      expect(result).toBeDefined()
      expect(result.winner).toBe('imposters')
      expect(result.reason).toBe('Imposters equal or outnumber crewmates')
    })

    it('should return null when game is still in progress', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: true },
        { name: 'Player2', role: 'crewmate', alive: true },
        { name: 'Imposter1', role: 'imposter', alive: true }
      ]

      const result = checkWinConditions()

      expect(result).toBeNull()
    })

    it('should handle undefined alive status by defaulting to true', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: undefined },
        { name: 'Player2', role: 'crewmate', alive: null },
        { name: 'Imposter1', role: 'imposter', alive: false }
      ]

      const result = checkWinConditions()

      // Should set alive to true for undefined/null
      expect(gameState.players[0].alive).toBe(true)
      expect(gameState.players[1].alive).toBe(true)

      // Crewmates should win since imposter is dead
      expect(result.winner).toBe('crewmates')
    })

    it('should throw error if no imposters existed (game malfunction)', () => {
      gameState.players = [
        { name: 'Player1', role: 'crewmate', alive: true },
        { name: 'Player2', role: 'crewmate', alive: true }
      ]

      expect(() => checkWinConditions()).toThrow('Game malfunction: No imposters were assigned at game start')
    })
  })

  describe('checkCrewmateVictory', () => {
    beforeEach(() => {
      // Clear mock calls
      vi.clearAllMocks()
    })

    it('should not call endGame when tasks are incomplete', () => {
      gameState.players = [
        {
          name: 'Player1',
          role: 'crewmate',
          alive: true,
          tasks: ['Task1', 'Task2'],
          tasksCompleted: 1
        },
        {
          name: 'Player2',
          role: 'crewmate',
          alive: true,
          tasks: ['Task3', 'Task4'],
          tasksCompleted: 1
        }
      ]

      checkCrewmateVictory()

      // Should not call endGame when tasks incomplete
      expect(endGame).not.toHaveBeenCalled()
    })

    it('should end game when all tasks are complete', () => {
      // Mock DOM elements that endGame and populateGameSummary try to access
      const mockElement = {
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        },
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild: vi.fn()
      }

      // Store original document
      const originalDocument = global.document

      // Mock document.getElementById while keeping document.body
      global.document = {
        ...originalDocument,
        getElementById: vi.fn(() => mockElement),
        body: originalDocument?.body || { innerHTML: '' },
        createElement: vi.fn(() => mockElement)
      }

      gameState.players = [
        {
          name: 'Player1',
          role: 'crewmate',
          alive: true,
          tasks: ['Task1', 'Task2'],
          tasksCompleted: 2
        },
        {
          name: 'Player2',
          role: 'crewmate',
          alive: true,
          tasks: ['Task3', 'Task4'],
          tasksCompleted: 2
        },
        {
          name: 'Imposter1',
          role: 'imposter',
          alive: true,
          tasks: [],
          tasksCompleted: 0
        }
      ]

      checkCrewmateVictory()

      // Restore original document
      global.document = originalDocument

      // Verify game ended with crewmates winning
      expect(gameState.gameEnded).toBe(true)
      expect(gameState.winner).toBe('crewmates')
      expect(gameState.stage).toBe('ended')
    })

    it('should count ALL crewmates tasks (including eliminated players)', () => {
      gameState.players = [
        {
          name: 'Player1',
          role: 'crewmate',
          alive: true,
          tasks: ['Task1', 'Task2', 'Task3'],
          tasksCompleted: 2 // Not all tasks complete
        },
        {
          name: 'Player2',
          role: 'crewmate',
          alive: false, // Eliminated player
          tasks: ['Task4', 'Task5'],
          tasksCompleted: 0 // Incomplete tasks
        },
        {
          name: 'Imposter1',
          role: 'imposter',
          alive: true,
          tasks: [],
          tasksCompleted: 0
        }
      ]

      checkCrewmateVictory()

      // Should not end game - only 2/5 total crewmate tasks complete
      // Both alive AND eliminated crewmates' tasks count toward total
      expect(endGame).not.toHaveBeenCalled()
    })

    it('should win when all tasks complete (including eliminated players completed tasks)', () => {
      // Mock DOM elements for endGame
      const mockElement = {
        classList: { add: vi.fn(), remove: vi.fn() },
        innerHTML: '',
        textContent: '',
        style: {},
        appendChild: vi.fn()
      }
      const originalDocument = global.document
      global.document = {
        ...originalDocument,
        getElementById: vi.fn(() => mockElement),
        body: originalDocument?.body || { innerHTML: '' },
        createElement: vi.fn(() => mockElement)
      }

      gameState.players = [
        {
          name: 'Player1',
          role: 'crewmate',
          alive: true,
          tasks: ['Task1', 'Task2'],
          tasksCompleted: 2 // All tasks complete
        },
        {
          name: 'Player2',
          role: 'crewmate',
          alive: false, // Eliminated player
          tasks: ['Task3', 'Task4'],
          tasksCompleted: 2 // All tasks complete (before elimination)
        },
        {
          name: 'Imposter1',
          role: 'imposter',
          alive: true,
          tasks: [],
          tasksCompleted: 0
        }
      ]

      checkCrewmateVictory()

      // Restore document
      global.document = originalDocument

      // Should end game - all 4 crewmate tasks complete (4/4)
      // Eliminated player's completed tasks count toward victory
      expect(gameState.gameEnded).toBe(true)
      expect(gameState.winner).toBe('crewmates')
    })

    it('should handle crewmates with no tasks', () => {
      gameState.players = [
        {
          name: 'Player1',
          role: 'crewmate',
          alive: true,
          tasks: [],
          tasksCompleted: 0
        }
      ]

      checkCrewmateVictory()

      // Should not throw with empty task list
      expect(endGame).not.toHaveBeenCalled()
    })
  })
})

// TODO: Add more test suites for:
// - Player management (join, leave, kick)
// - Game state transitions
// - Voting logic
// - Task toggling
