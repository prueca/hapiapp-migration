export default class Logger {
    label = ''

    constructor(label: string) {
        this.label = label
    }

    print(arg: string | object) {
        if (typeof arg === 'object') {
            arg = JSON.stringify(arg, null, 2)
        }

        console.log(`[${this.label}] ${arg}`)
    }
}
