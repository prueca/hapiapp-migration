export default class Logger {
    label = ''

    constructor(label: string) {
        this.label = label
    }

    print(message: string) {
        console.log(`[${this.label}] ${message}`)
    }
}
