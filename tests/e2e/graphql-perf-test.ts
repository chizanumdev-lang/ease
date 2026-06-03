import axios from 'axios';

const BASE_URL = 'http://173.212.248.253:3005';
const REST_API = `${BASE_URL}/api`;
const GRAPHQL_API = `${BASE_URL}/graphql`;

async function runTests() {
  console.log(`--- Running Server Performance Tests on ${BASE_URL} ---`);
  
  let token = '';

  // 1. REST API Auth (Signup & Login)
  try {
    const start = Date.now();
    const testEmail = `test_${Date.now()}@example.com`;
    const res = await axios.post(`${REST_API}/auth/signup`, {
      email: testEmail,
      password: 'Password123!',
      name: 'Test User'
    });
    token = res.data.access_token || res.data.accessToken;
    console.log(`✅ [REST: Signup] Success - Took ${Date.now() - start}ms`);
  } catch (e: any) {
    console.log(`❌ [REST: Signup] Failed - ${e.response?.data?.message || e.message}`);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  async function gqlQuery(name: string, query: string, variables: any = {}) {
    const start = Date.now();
    try {
      const res = await axios.post(GRAPHQL_API, { query, variables }, { headers });
      if (res.data.errors) {
        console.log(`❌ [GraphQL: ${name}] Failed after ${Date.now() - start}ms - ${res.data.errors[0].message}`);
        return null;
      }
      console.log(`✅ [GraphQL: ${name}] Success - Took ${Date.now() - start}ms`);
      return res.data.data;
    } catch (e: any) {
      console.log(`❌ [GraphQL: ${name}] Failed after ${Date.now() - start}ms - ${e.message}`);
      return null;
    }
  }

  // Goal
  const createGoalRes = await gqlQuery('Mutation: createGoal', `
    mutation($createGoalDto: CreateGoalDto!) {
      createGoal(createGoalDto: $createGoalDto) {
        id
        title
      }
    }
  `, {
    createGoalDto: {
      title: 'Get Fit',
      description: 'Lose 10 lbs',
      category: 'Health',
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  });

  const goalId = createGoalRes?.createGoal?.id;

  // getGoals
  if (goalId) {
    await gqlQuery('Query: getGoals', `
      query {
        getGoals {
          id
          title
        }
      }
    `);

    // getGoalById
    await gqlQuery('Query: getGoalById', `
      query($id: ID!) {
        getGoalById(id: $id) {
          id
          title
        }
      }
    `, { id: goalId });
  }

  // Generate Program
  const generateProgramRes = await gqlQuery('Mutation: generateProgram', `
    mutation($generateProgramDto: GenerateProgramDto!) {
      generateProgram(generateProgramDto: $generateProgramDto) {
        id
        title
        status
      }
    }
  `, {
    generateProgramDto: {
      goalId: goalId,
      goalDescription: 'Lose 10 lbs',
      category: 'Health',
      duration: 7,
      minutesPerDay: 30,
      learningStyle: 'visual',
      constraints: ['No gym']
    }
  });

  const programId = generateProgramRes?.generateProgram?.id;

  // getActiveProgram
  await gqlQuery('Query: getActiveProgram', `
    query {
      getActiveProgram {
        id
        title
      }
    }
  `);

  // createCheckin
  await gqlQuery('Mutation: createCheckin', `
    mutation($createCheckinDto: CreateCheckinDto!) {
      createCheckin(createCheckinDto: $createCheckinDto) {
        id
        checkinDate
      }
    }
  `, {
    createCheckinDto: {
      mood: 'Happy',
      notes: 'Feeling great',
      metrics: { stress: 2 }
    }
  });
  
  // Clean up Goal
  if (goalId) {
    await gqlQuery('Mutation: deleteGoal', `
      mutation($id: ID!) {
        deleteGoal(id: $id)
      }
    `, { id: goalId });
  }

}

runTests().catch(console.error);
