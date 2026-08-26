import { parse } from 'csv-parse'
import fs from 'node:fs'

export default async (source: string) => {
    const ext = source.split('.').pop()
    let arr: Json[] = []

    switch (ext) {
        case 'csv':
            await new Promise((resolve, reject) => {
                fs.createReadStream(source)
                    .pipe(
                        parse({
                            columns: true,
                            skip_empty_lines: true,
                            bom: true,
                        }),
                    )
                    .on('end', () => resolve(arr))
                    .on('error', (error) => reject(error))
                    .on('data', (data) => arr.push(data))
            })
            break

        case 'json':
            arr = (await import(source)).default
            break
    }

    return arr
}
