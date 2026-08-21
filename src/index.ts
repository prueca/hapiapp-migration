import 'dotenv/config'
import { select } from '@inquirer/prompts'

const source = './script'

const run = async () => {
    const choices = [
        {
            name: 'Populate account table',
            value: `${source}/populate.account.ts`,
        },
        {
            name: 'Populate user table',
            value: `${source}/populate.user.ts`,
        },
    ]

    const answer = await select({
        choices,
        message: 'Select a script to run:',
    })

    const fn = (await import(`./${answer}`)).default
    await fn()

    console.log('Done')
}

run()
