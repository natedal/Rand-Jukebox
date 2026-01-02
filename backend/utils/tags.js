/**
 * Generate human-readable tags from Spotify audio features
 * @param {Object} audioFeatures - Spotify audio features object
 * @returns {string[]} Array of tag strings
 */
export function generateTags(audioFeatures) {
  if (!audioFeatures) {
    return [];
  }

  const tags = [];

  // Energy and danceability → upbeat, danceable
  if (audioFeatures.energy > 0.7 && audioFeatures.danceability > 0.7) {
    tags.push('upbeat');
    tags.push('danceable');
  }

  // High energy alone → energetic
  if (audioFeatures.energy > 0.75) {
    tags.push('energetic');
  }

  // Low energy → mellow, chill
  if (audioFeatures.energy < 0.4) {
    tags.push('mellow');
    tags.push('chill');
  }

  // High danceability → danceable
  if (audioFeatures.danceability > 0.75) {
    tags.push('danceable');
  }

  // Valence (positivity) → happy, positive
  if (audioFeatures.valence > 0.7) {
    tags.push('happy');
    tags.push('positive');
  }

  // Low valence → sad, melancholic
  if (audioFeatures.valence < 0.3) {
    tags.push('melancholic');
  }

  // Acousticness → acoustic, jazzy
  if (audioFeatures.acousticness > 0.7) {
    tags.push('acoustic');
    if (audioFeatures.tempo < 120) {
      tags.push('jazzy');
      tags.push('smooth');
    }
  }

  // Low tempo + high acousticness → jazzy, smooth
  if (audioFeatures.tempo < 100 && audioFeatures.acousticness > 0.6) {
    tags.push('jazzy');
    tags.push('smooth');
  }

  // High tempo → fast-paced
  if (audioFeatures.tempo > 140) {
    tags.push('fast-paced');
  }

  // Instrumental → instrumental
  if (audioFeatures.instrumentalness > 0.7) {
    tags.push('instrumental');
  }

  // Speechiness → spoken word, rap
  if (audioFeatures.speechiness > 0.66) {
    tags.push('rap');
  } else if (audioFeatures.speechiness > 0.33) {
    tags.push('spoken-word');
  }

  // Liveness → live
  if (audioFeatures.liveness > 0.7) {
    tags.push('live');
  }

  // Remove duplicates and return
  return [...new Set(tags)];
}

