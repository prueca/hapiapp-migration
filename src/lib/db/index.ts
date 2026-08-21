import _ from 'lodash'
import User from './User'
import sequelize from './sequelize'
import Account from './Account'
import Access from './Access'

const models = {
    Account,
    User,
    Access,
}

type ModelWithAssociate = {
    associate?: (arg: typeof models) => void
}

_.values(models).map((model) => {
    let assoc = (model as typeof model & ModelWithAssociate).associate

    if (typeof assoc !== 'function') {
        return
    }

    assoc = assoc.bind(model)
    assoc(models)
})

export { sequelize }
export default models
