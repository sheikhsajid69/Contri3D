const GH_API = 'https://api.github.com/graphql';

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}`;

export async function fetchGitHub(username) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN env var not set');

  const res = await fetch(GH_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: QUERY, variables: { login: username } }),
  });

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);

  const weeks = json.data.user.contributionsCollection.contributionCalendar.weeks;
  const result = {};
  weeks.forEach(week => {
    week.contributionDays.forEach(day => {
      result[day.date] = day.contributionCount;
    });
  });
  return result;
}
