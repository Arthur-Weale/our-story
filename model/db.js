import { MongoClient } from 'mongodb';

let client;
let database;

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is missing from the environment.');
    }

    if (!database) {
        const pendingClient = new MongoClient(uri);
        try {
            await pendingClient.connect();
            client = pendingClient;
            database = client.db('theProposal');
        } catch (error) {
            await pendingClient.close().catch(() => {});
            throw error;
        }
    }

    return {
        database,
        users: database.collection('users')
    };
}

export { connectToDatabase };
