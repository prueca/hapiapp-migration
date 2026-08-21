import { monotonicFactory, isValid } from 'ulid'

const ulid = monotonicFactory()
const generate = () => ulid()

const validator = (nullable = false) => {
    return (value: string) => {
        if (nullable && value === null) {
            return
        }

        if (!isValid(value)) {
            throw new Error('Invalid Id')
        }
    }
}

export default {
    isValid,
    generate,
    validator,
}
