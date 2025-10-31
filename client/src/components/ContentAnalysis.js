import React from 'react';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';

const ContentAnalysis = ({ analysis, type }) => {
  if (!analysis) return null;

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          📊 内容分析结果
        </Typography>
        
        {type === 'video' && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">时长</Typography>
              <Typography variant="h6">{analysis.duration}秒</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">分辨率</Typography>
              <Typography variant="h6">{analysis.resolution}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">帧率</Typography>
              <Typography variant="h6">{analysis.frame_rate}fps</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">内容标签</Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.content_tags?.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {type === 'audio' && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">时长</Typography>
              <Typography variant="h6">{analysis.duration}秒</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">比特率</Typography>
              <Typography variant="h6">{analysis.bit_rate}kbps</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">采样率</Typography>
              <Typography variant="h6">{analysis.sample_rate}Hz</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">音乐标签</Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.music_tags?.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {type === 'image' && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">分辨率</Typography>
              <Typography variant="h6">{analysis.resolution}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">主要颜色</Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.colors?.map((color, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: 20,
                      height: 20,
                      backgroundColor: color,
                      display: 'inline-block',
                      mr: 1,
                      border: '1px solid #ccc'
                    }}
                  />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">识别物体</Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.objects?.map((object, index) => (
                  <Chip key={index} label={object} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {type === 'text' && (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">内容标签</Typography>
              <Box sx={{ mt: 1 }}>
                {analysis.content_tags?.map((tag, index) => (
                  <Chip key={index} label={tag} size="small" sx={{ mr: 1, mb: 1 }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentAnalysis;


