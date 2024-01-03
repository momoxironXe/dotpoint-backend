import config from 'config';
import mongoose from 'mongoose';
import { counterModel } from '../models/counter';

const dbUrl: any = config.get('db_url');

mongoose.set("strictQuery", false);

export const mongooseConnection = mongoose.connect(
    dbUrl, {}
).then(result => console.log('Database successfully connected')).catch(err => console.log(err));

export function autoIncrementPlugin(schema, options) {
    schema.pre('save', async function (next) {
        const doc = this;
        var counter = await counterModel.findOneAndUpdate({ name: options.modelName }, { $inc: { seqValue: 1 } }, { new: true, upsert: true });
        doc.id = counter.seqValue
        next();
    });
}

export function paymentNumericValue(schema, options) {
    schema.pre('save', async function (next) {
        for (const key in this) {
            if (typeof this[key] === 'number') {
                // Round numeric fields to 2 decimal places
                this[key] = parseFloat((this[key]).toFixed(2))
            }
        }
        next();
    });
    schema.pre('findOneAndUpdate', async function (next) {
        const update = this.getUpdate();
        if (update?.paymentSubItems?.length > 0 && update?.paymentSubItems) {
            for (const key in update?.paymentSubItems) {
                if (typeof update?.paymentSubItems[key] === 'number') {
                    // Round numeric fields to 2 decimal places
                    update.paymentSubItems[key] = parseFloat((update?.paymentSubItems[key]).toFixed(2))
                }

            }
        }
        for (const key in update) {
            if (typeof update[key] === 'number') {
                // Round numeric fields to 2 decimal places
                update[key] = parseFloat((update[key]).toFixed(2))
            }

        }
        next();
    });
    schema.pre('updateOne', async function (next) {
        const update = this.getUpdate();
        if (update?.paymentSubItems?.length > 0) {
            for (const index in update?.paymentSubItems) {
                for (const key in update?.paymentSubItems[index]) {
                    if (typeof update?.paymentSubItems[index][key] === 'number') {
                        // Round numeric fields to 2 decimal places
                        update.paymentSubItems[index][key] = parseFloat((update?.paymentSubItems[index][key]).toFixed(2))
                    }
                }
            }
        }
        for (const key in update) {
            if (typeof update[key] === 'number') {
                // Round numeric fields to 2 decimal places
                update[key] = parseFloat((update[key]).toFixed(2))
            }

        }
        next();
    });
}

// async function insertManyWithUniqueSequence(records) {
//     // Retrieve the highest existing sequence number
//     const lastDocument = await YourModel.findOne({}, 'sequenceNumber')
//         .sort({ sequenceNumber: -1 })
//         .exec();

//     let sequenceNumber;
//     if (lastDocument) {
//         sequenceNumber = lastDocument.sequenceNumber + 1;
//     } else {
//         // If no documents exist, start the sequence from 1 or any desired initial value
//         sequenceNumber = 1;
//     }

//     // Map the records and assign a unique sequence number to each
//     const documents = records.map((record) => {
//         return {
//             sequenceNumber: sequenceNumber++,
//             // Assign other fields from the record as needed
//             // For example: field1: record.field1, field2: record.field2, etc.
//         };
//     });

//     // Insert the documents into the collection
//     return YourModel.insertMany(documents);
// }