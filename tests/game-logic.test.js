import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateRoomCode,
  getGameURL
  // TODO: Add more exports as needed - functions are now exported from game-logic.js
} from '../js/game-logic.js'
import { gameState } from '../js/game-state.js'

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

// TODO: Add more test suites for:
// - Player management (join, leave, kick)
// - Game state transitions
// - Task management
// - Voting logic
// - Win condition checks
