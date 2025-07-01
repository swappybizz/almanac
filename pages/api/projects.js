// pages/api/projects.js
import { getAuth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { db } = await connectToDatabase();
  const projectsCol = db.collection('projects');

  if (req.method === 'GET') {
    // List all projects for this user
    const projects = await projectsCol.find({ userId }).toArray();
    return res.status(200).json(projects);
  }

  if (req.method === 'POST') {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name is required' });

    // Insert if not exists
    let project = await projectsCol.findOne({ userId, name });
    if (!project) {
      const result = await projectsCol.insertOne({ userId, name });
      project = { _id: result.insertedId, userId, name };
    }
    return res.status(200).json(project);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
