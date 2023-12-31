import {Bounds, Coordinate, Translation} from "~lib/types.ts"
import {SerializableClass, deserialize, registerClass, serialize} from "~lib/serialize.ts"
import {Grid} from "~lib/Grid.ts"
import {Problem} from "~lib/Problem.ts"
import {arrayContainsCoordinate} from "~lib/utils.ts"
import {getNextColor} from "~lib/colors.ts"

export class PiecePlacement extends SerializableClass {
    originalPiece: Piece
    transformedPiece: Piece
    translation: Translation | null
    
    constructor(
        originalPiece: Piece,
        transformedPiece: Piece,
        translation: Translation | null = null,
    ) {
        super(null)
        this.originalPiece = originalPiece
        this.transformedPiece = transformedPiece
        this.translation = translation
    }
}
registerClass(PiecePlacement)

export class Puzzle extends SerializableClass {
    grid: Grid
    pieces: Map<string, Piece>
    problems: Map<string, Problem>

    constructor(id: string, grid: Grid) {
        super(id)
        this.grid = grid
        this.pieces = new Map()
        this.problems = new Map()
    }

    generateId(
        prefix: string,
        listAttribute: "pieces" | "problems"
    ): string {
        //TODO: Make this O(1), not O(n)
        for(let i=0; ; i++) {
            const id = prefix+"-"+i
            if(!this[listAttribute].has(id)) {
                return id
            }
        }
    }

    getNewPieceColor(): string {
        const piecesList = Array.from(this.pieces.values())
        const existingColors = piecesList.map((piece) => piece.color)
        return getNextColor(existingColors)
    }

    addPiece(piece: Piece): Piece {
        if(piece.id === null) {
            throw "Cannot add piece without ID"
        }
        if(this.pieces.has(piece.id)) {
            throw `Duplicate piece ID: ${piece.id}`
        }
        this.pieces.set(piece.id, piece)
        return piece
    }

    hasPiece(pieceOrId: Piece | string): boolean {
        let id = typeof pieceOrId === "string" ? pieceOrId : pieceOrId.id
        if(id === null) return false
        return this.pieces.has(id)
    }

    removePiece(pieceOrId: Piece | string, throwErrors=true) {
        let id = typeof pieceOrId === "string" ? pieceOrId : pieceOrId.id
        if(id === null) {
            if(throwErrors) {
                throw "Cannot remove piece without ID"
            }
            return
        }
        if(throwErrors && !this.pieces.has(id)) {
            throw `Piece ID not found: ${id}`
        }
        this.pieces.delete(id)
    }

    addProblem(problem: Problem): Problem {
        if(this.problems.has(problem.id)) {
            throw `Duplicate problem ID: ${problem.id}`
        }
        this.problems.set(problem.id, problem)
        return problem
    }

    hasProblem(problemOrId: Problem | string): boolean {
        let id = typeof problemOrId === "string" ? problemOrId : problemOrId.id
        return this.problems.has(id)
    }

    removeProblem(problemOrId: Problem | string, throwErrors=true) {
        let id = typeof problemOrId === "string" ? problemOrId : problemOrId.id
        if(throwErrors && !this.problems.has(id)) {
            throw `Problem ID not found: ${id}`
        }
        this.problems.delete(id)
    }

    getPieceFromPieceOrId(pieceOrId: Piece | string): Piece {
        if(typeof pieceOrId === "string") {
            const piece = this.pieces.get(pieceOrId)
            if(!piece) {
                throw `Piece ID not found: ${pieceOrId}`
            }
            return piece
        } else {
            return pieceOrId
        }
    }

    *getPieceVariations(pieceOrId: Piece | string): Iterable<PiecePlacement> {
        const piece = this.getPieceFromPieceOrId(pieceOrId)
        const orientations = this.grid.getOrientations()
        for(const orientation of orientations) {
            const newCoordinates = orientation.orientationFunc(piece.coordinates)
            if(newCoordinates === null) { continue }
            const transformedPiece = piece.copy()
            transformedPiece.coordinates = newCoordinates
            yield new PiecePlacement(piece, transformedPiece)
        }
    }

    *getPieceTranslations(
        pieceOrId: Piece | string,
        availableCoordinates: Coordinate[]
    ): Iterable<PiecePlacement> {
        const piece = this.getPieceFromPieceOrId(pieceOrId)

        for(const toCoordinate of availableCoordinates) {
            const translation = this.grid.getTranslation(piece.coordinates[0], toCoordinate)
            if(translation === null) { continue }

            const newCoordinates = []
            for(const oldCoordinate of piece.coordinates) {
                const newCoordinate = this.grid.translate(oldCoordinate, translation)
                if(newCoordinate === null || !arrayContainsCoordinate(availableCoordinates, newCoordinate)) {
                    break
                }
                newCoordinates.push(newCoordinate)
            }
            if(newCoordinates.length !== piece.coordinates.length) {
                continue
            }

            const newPiece = piece.copy()
            newPiece.coordinates = newCoordinates
            yield new PiecePlacement(piece, newPiece, translation)
        }
    }

    *getPiecePlacements(
        pieceOrId: Piece | string,
        availableCoordinates: Coordinate[]
    ): Iterable<PiecePlacement> {

        const usedPlacements: Set<string> = new Set()
        function getPlacementKey(piece: Piece): string {
            const coordStrings = piece.coordinates.map((coordinate) =>
                coordinate.join(",")
            )
            coordStrings.sort()
            return coordStrings.join(";")
        }

        const piece = this.getPieceFromPieceOrId(pieceOrId)
        for(const pieceVariation of this.getPieceVariations(piece)) {
            const pieceTranslations = this.getPieceTranslations(
                pieceVariation.transformedPiece,
                availableCoordinates
            )
            const z = Array.from(pieceTranslations)
            for(const pieceTranslation of z) {

                const key = getPlacementKey(pieceTranslation.transformedPiece)
                if(usedPlacements.has(key)) continue
                usedPlacements.add(key)

                yield new PiecePlacement(
                    piece,
                    pieceTranslation.transformedPiece,
                    pieceTranslation.translation,
                )
            }
        }
    }
}

export class Piece extends SerializableClass {
    bounds: Bounds
    coordinates: Coordinate[]
    label: string
    color: string

    constructor(id: string | null, bounds: Bounds, coordinates: Coordinate[]=[]) {
        super(id)
        this.bounds = bounds
        this.coordinates = coordinates
        this.label = id || "unlabeled-piece"
        this.color = "#00ff00"
    }

    copy(): Piece {
        const coppied = deserialize<Piece>(serialize(this), "Piece")
        coppied.id = null
        return coppied
    }
}

registerClass(Puzzle)
registerClass(Piece)