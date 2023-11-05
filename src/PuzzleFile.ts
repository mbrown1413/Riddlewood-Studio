import { v4 as uuid } from "uuid";

import {Puzzle} from "./puzzle"
import {SerializableClass, deserialize, registerClass, serialize} from "./serialize"

export type PuzzleMetadata = {
    id: string,
    name: string,
    author: string,
    description: string,

    // Dates in UTC timestamp strings
    created: string,
    modified: string,
}

export class PuzzleFile extends SerializableClass {
    puzzle: Puzzle

    name: string
    author: string
    description: string
    created: string
    modified: string

    constructor(
        puzzle: Puzzle,
        name: string,
        author: string="",
        description: string="",
    ) {
        super(uuid())
        this.puzzle = puzzle
        this.name = name
        this.author = author
        this.description = description
        this.created = new Date().toUTCString()
        this.modified = this.created
    }

    serialize() {
        this.modified = new Date().toUTCString()
        return JSON.stringify(serialize(this))
    }

    static deserialize(data: string) {
        return deserialize<PuzzleFile>(JSON.parse(data), "PuzzleFile")
    }
    
    getMetadata(): PuzzleMetadata {
        return {
            id: this.id,
            name: this.name,
            author: this.author,
            description: this.description,
            created: this.created,
            modified: this.modified,
        }
    }
}

registerClass(PuzzleFile)